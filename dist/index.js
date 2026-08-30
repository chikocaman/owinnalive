// server/index.ts
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

// server/push-handlers.ts
import webpush from "web-push";
import mysql from "mysql2/promise";
var publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
var privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
var subject = process.env.VAPID_SUBJECT ?? "";
if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}
function isPushConfigured() {
  return Boolean(publicKey && privateKey && subject);
}
var connectionPromise = null;
async function getConnection() {
  if (!connectionPromise) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured");
    connectionPromise = mysql.createConnection(url);
  }
  return connectionPromise;
}
function isSubscription(value) {
  if (!value || typeof value !== "object") return false;
  const candidate = value;
  return typeof candidate.endpoint === "string" && candidate.endpoint.length > 20 && typeof candidate.keys?.p256dh === "string" && typeof candidate.keys?.auth === "string";
}
async function getPublicKey() {
  if (!publicKey) return { status: 503, body: { error: "Push notifications are not configured" } };
  return { status: 200, body: { publicKey } };
}
async function subscribe(body) {
  if (!isPushConfigured()) return { status: 503, body: { error: "Push notifications are not configured" } };
  const subscription = body?.subscription;
  if (!isSubscription(subscription)) return { status: 400, body: { error: "Invalid push subscription" } };
  try {
    const connection = await getConnection();
    await connection.execute(
      `INSERT INTO push_subscriptions (userId, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth), updatedAt = CURRENT_TIMESTAMP`,
      [0, subscription.endpoint, subscription.keys?.p256dh ?? null, subscription.keys?.auth ?? null]
    );
    return { status: 200, body: { ok: true } };
  } catch (error) {
    console.error("[push] subscription persistence failed", error);
    return { status: 500, body: { error: "Unable to save push subscription" } };
  }
}
async function unsubscribe(body) {
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) return { status: 400, body: { error: "Missing push endpoint" } };
  try {
    const connection = await getConnection();
    await connection.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", [endpoint]);
    return { status: 200, body: { ok: true } };
  } catch (error) {
    console.error("[push] subscription deletion failed", error);
    return { status: 500, body: { error: "Unable to remove push subscription" } };
  }
}
async function sendTest() {
  if (!isPushConfigured()) return { status: 503, body: { error: "Push notifications are not configured" } };
  try {
    const connection = await getConnection();
    const [rows] = await connection.query("SELECT endpoint, p256dh, auth FROM push_subscriptions");
    const subscriptions = rows;
    await Promise.all(subscriptions.map(async (item) => {
      try {
        await webpush.sendNotification({ endpoint: item.endpoint, keys: { p256dh: item.p256dh, auth: item.auth } }, JSON.stringify({ title: "FootyScores Pro", body: "Push notifications are working.", tag: "footyscores-test" }));
      } catch (error) {
        const statusCode = error && typeof error === "object" && "statusCode" in error ? Number(error.statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) await connection.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", [item.endpoint]);
      }
    }));
    return { status: 200, body: { ok: true, delivered: subscriptions.length } };
  } catch (error) {
    console.error("[push] test delivery failed", error);
    return { status: 500, body: { error: "Unable to send test notification" } };
  }
}

// server/push.ts
var RATE_LIMIT_WINDOW = 60 * 1e3;
var RATE_LIMIT_MAX = 5;
var rateLimitStore = /* @__PURE__ */ new Map();
function getRateLimitKey(req, endpoint) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";
  return `${ip}:${endpoint}`;
}
function checkRateLimit(req, endpoint) {
  const key = getRateLimitKey(req, endpoint);
  const now = Date.now();
  const current = rateLimitStore.get(key);
  if (!current || now > current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (current.count >= RATE_LIMIT_MAX) {
    return false;
  }
  current.count++;
  return true;
}
function send(res, result) {
  res.status(result.status).json(result.body);
}
function registerPushRoutes(app) {
  app.get("/api/push/public-key", async (_req, res) => send(res, await getPublicKey()));
  app.post("/api/push/subscribe", async (req, res) => {
    if (!checkRateLimit(req, "subscribe")) {
      return send(res, { status: 429, body: { error: "Too many requests" } });
    }
    send(res, await subscribe(req.body));
  });
  app.delete("/api/push/subscribe", async (req, res) => {
    if (!checkRateLimit(req, "subscribe")) {
      return send(res, { status: 429, body: { error: "Too many requests" } });
    }
    send(res, await unsubscribe(req.body));
  });
  app.post("/api/push/test", async (req, res) => {
    if (!checkRateLimit(req, "test")) {
      return send(res, { status: 429, body: { error: "Too many requests" } });
    }
    send(res, await sendTest());
  });
}

// server/malawi.ts
var RESULTS_URL = "https://www.flashscore.com/football/malawi/super-league/results/";
var FIXTURES_URL = "https://www.flashscore.com/football/malawi/super-league/fixtures/";
var EVENT_URL = "https://www.flashscore.com/1/x/feed/df_sui_1_";
var MALAWI_OFFSET_MS = 2 * 60 * 60 * 1e3;
var CACHE_MS = 2e4;
var MALAWI_SCOREBOARD_CACHE_SECONDS = CACHE_MS / 1e3;
var FLASH_HEADERS = {
  Accept: "text/plain, text/html, */*",
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "x-fsign": "SW9D1eZo",
  Referer: "https://www.flashscore.com/"
};
function readFields(record) {
  return record.split("\xAC").reduce((fields, segment) => {
    const splitAt = segment.indexOf("\xF7");
    if (splitAt > -1) fields[segment.slice(0, splitAt)] = segment.slice(splitAt + 1);
    return fields;
  }, {});
}
function parseMalawiMatchRecords(feed) {
  const matches = /* @__PURE__ */ new Map();
  for (const record of Array.from(feed.matchAll(/AA÷([A-Za-z0-9]{8})¬([^~]*)/g))) {
    const id = record[1];
    const fields = readFields(record[2]);
    const kickoffSeconds = Number(fields.AD);
    if (!fields.CX || !fields.AF || !Number.isFinite(kickoffSeconds)) continue;
    const localDate = new Date(kickoffSeconds * 1e3 + MALAWI_OFFSET_MS);
    const status = fields.AB === "3" ? "finished" : fields.AB === "2" ? "live" : "scheduled";
    const parsed = {
      id,
      kickoff: kickoffSeconds * 1e3,
      date: localDate.toISOString().slice(0, 10),
      time: localDate.toISOString().slice(11, 16),
      round: fields.ER || "Super League",
      home: fields.CX,
      away: fields.AF,
      homeScore: fields.AG === void 0 || fields.AG === "" ? null : Number(fields.AG),
      awayScore: fields.AH === void 0 || fields.AH === "" ? null : Number(fields.AH),
      status
    };
    const existing = matches.get(id);
    if (!existing || parsed.status === "live" || parsed.status === "finished") matches.set(id, parsed);
  }
  return Array.from(matches.values());
}
function parseMalawiGoalEvents(feed) {
  const goals = [];
  let active = null;
  const complete = () => {
    if (active?.id && active.team && active.minute && active.player && active.kind) goals.push(active);
  };
  for (const segment of feed.split(/[¬~]/)) {
    const splitAt = segment.indexOf("\xF7");
    if (splitAt < 0) continue;
    const key = segment.slice(0, splitAt);
    const value = segment.slice(splitAt + 1);
    if (key === "III") {
      complete();
      active = { id: value };
    } else if (active && key === "IA") active.team = value === "1" ? "home" : "away";
    else if (active && key === "IB") active.minute = value.replace(/['’]/g, "");
    else if (active && key === "IF") active.player = value.trim();
    else if (active && key === "IK") active.kind = /penalty/i.test(value) ? "penalty" : value === "Goal" ? "goal" : void 0;
  }
  complete();
  return goals;
}
var scoreboardCache = null;
var eventsCache = /* @__PURE__ */ new Map();
var EVENTS_CACHE_MS = 15e3;
var MALAWI_EVENTS_CACHE_SECONDS = EVENTS_CACHE_MS / 1e3;
async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15e3);
  try {
    const response = await fetch(url, { headers: FLASH_HEADERS, signal: controller.signal });
    if (!response.ok) throw new Error(`Malawi source returned ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}
async function loadMalawiScoreboard() {
  if (scoreboardCache && scoreboardCache.expiresAt > Date.now()) return scoreboardCache.data;
  const [results, fixtures] = await Promise.all([fetchText(RESULTS_URL), fetchText(FIXTURES_URL)]);
  const unique = /* @__PURE__ */ new Map();
  [...parseMalawiMatchRecords(results), ...parseMalawiMatchRecords(fixtures)].forEach((match) => {
    const existing = unique.get(match.id);
    if (!existing || match.status === "live" || match.status === "finished") unique.set(match.id, match);
  });
  const data = Array.from(unique.values()).sort((a, b) => a.kickoff - b.kickoff);
  scoreboardCache = { expiresAt: Date.now() + CACHE_MS, data };
  return data;
}
async function loadMalawiEvents(matchId) {
  if (!/^[A-Za-z0-9]{8}$/.test(matchId)) throw new Error("Invalid Malawi match id");
  const cached = eventsCache.get(matchId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const data = parseMalawiGoalEvents(await fetchText(`${EVENT_URL}${matchId}`));
  eventsCache.set(matchId, { expiresAt: Date.now() + EVENTS_CACHE_MS, data });
  return data;
}
function registerMalawiRoutes(app) {
  app.get("/api/malawi/scoreboard", async (_req, res) => {
    try {
      const matches = await loadMalawiScoreboard();
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.json({ source: "flashscore-malawi-super-league", fetchedAt: Date.now(), matches });
    } catch (error) {
      console.error("[malawi] scoreboard failed", error);
      res.status(502).json({ error: "Malawi Super League source is temporarily unavailable" });
    }
  });
  app.get("/api/malawi/events/:matchId", async (req, res) => {
    const matchId = req.params.matchId;
    if (!/^[A-Za-z0-9]{8}$/.test(matchId)) {
      res.status(400).json({ error: "Invalid Malawi match id" });
      return;
    }
    try {
      const events = await loadMalawiEvents(matchId);
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.json({ source: "flashscore-malawi-super-league", fetchedAt: Date.now(), events });
    } catch (error) {
      console.error("[malawi] events failed", error);
      res.status(502).json({ error: "Malawi goal events are temporarily unavailable" });
    }
  });
}

// server/espn-proxy.ts
var ESPN_HOSTS = /* @__PURE__ */ new Set(["site.api.espn.com", "sports.core.api.espn.com"]);
var LIVE_CACHE_MS = 8e3;
var STATIC_CACHE_MS = 10 * 60 * 1e3;
var MAX_CACHE_ENTRIES = 1e3;
var ESPN_LIVE_CACHE_SECONDS = LIVE_CACHE_MS / 1e3;
var ESPN_STATIC_CACHE_SECONDS = STATIC_CACHE_MS / 1e3;
function isLiveEspnPath(pathname) {
  return pathname.includes("scoreboard") || pathname.includes("summary");
}
var UnsupportedEspnHostError = class extends Error {
  constructor() {
    super("Unsupported ESPN host");
    this.name = "UnsupportedEspnHostError";
  }
};
var responseCache = /* @__PURE__ */ new Map();
var inFlightRequests = /* @__PURE__ */ new Map();
function cacheKeyFor(target) {
  const params = new URLSearchParams(target.search);
  params.delete("liveRefresh");
  params.sort();
  return `${target.hostname}${target.pathname}?${params.toString()}`;
}
function pruneExpiredCacheEntries() {
  if (responseCache.size <= MAX_CACHE_ENTRIES) return;
  const now = Date.now();
  responseCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) responseCache.delete(key);
  });
}
async function fetchWithRetry(target, signal, maxAttempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(target, { signal, headers: { Accept: "application/json", "User-Agent": "FootyScores-Pro/1.0" } });
      if (response.ok || response.status < 500 || attempt === maxAttempts - 1) return response;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.name === "AbortError") throw error;
      if (attempt < maxAttempts - 1) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("ESPN request failed");
}
async function fetchFromEspn(target, isLiveScoreRequest) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), isLiveScoreRequest ? 12e3 : 15e3);
  try {
    const response = await fetchWithRetry(target, controller.signal, isLiveScoreRequest ? 1 : 3);
    const body = Buffer.from(await response.arrayBuffer());
    return {
      status: response.status,
      contentType: response.headers.get("content-type") || "application/json",
      body,
      expiresAt: Date.now() + (isLiveScoreRequest ? LIVE_CACHE_MS : STATIC_CACHE_MS)
    };
  } finally {
    clearTimeout(timer);
  }
}
async function proxyEspnRequest(rawTarget) {
  const target = new URL(`https://${rawTarget}`);
  if (!ESPN_HOSTS.has(target.hostname)) throw new UnsupportedEspnHostError();
  const isLiveScoreRequest = isLiveEspnPath(target.pathname);
  const key = cacheKeyFor(target);
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      status: cached.status,
      contentType: cached.contentType,
      body: cached.body,
      cacheStatus: "hit",
      cacheControl: `public, max-age=${Math.max(1, Math.ceil((cached.expiresAt - Date.now()) / 1e3))}`
    };
  }
  let pending = inFlightRequests.get(key);
  if (!pending) {
    pending = fetchFromEspn(target, isLiveScoreRequest);
    inFlightRequests.set(key, pending);
    pending.finally(() => inFlightRequests.delete(key));
  }
  const entry = await pending;
  if (entry.status < 500) {
    responseCache.set(key, entry);
    pruneExpiredCacheEntries();
  }
  return {
    status: entry.status,
    contentType: entry.contentType,
    body: entry.body,
    cacheStatus: "miss",
    cacheControl: isLiveScoreRequest ? `public, max-age=${LIVE_CACHE_MS / 1e3}` : `public, max-age=${STATIC_CACHE_MS / 1e3}, stale-while-revalidate=3600`
  };
}

// server/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function proxyEspn(req, res) {
  const rawTarget = req.originalUrl.replace(/^\/api\/espn\/?/, "");
  try {
    const result = await proxyEspnRequest(rawTarget);
    res.status(result.status);
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Cache-Control", result.cacheControl);
    res.setHeader("X-FootyScores-Cache", result.cacheStatus);
    res.send(result.body);
  } catch (error) {
    if (error instanceof UnsupportedEspnHostError) {
      res.status(403).json({ error: "Unsupported ESPN host" });
      return;
    }
    if (error instanceof TypeError) {
      res.status(400).json({ error: "Invalid ESPN target" });
      return;
    }
    const message = error instanceof Error && error.name === "AbortError" ? "ESPN request timed out" : "ESPN request failed";
    res.status(504).json({ error: message });
  }
}
async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "32kb" }));
  registerPushRoutes(app);
  registerMalawiRoutes(app);
  app.use("/api/espn", (req, res) => void proxyEspn(req, res));
  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
  const port = process.env.PORT || 3e3;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
