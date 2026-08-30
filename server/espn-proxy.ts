/**
 * FootyScores Pro — shared ESPN proxy core.
 * Used by both the production Express server (server/index.ts) and the Vite
 * dev-server middleware (vite.config.ts) so `pnpm dev` and the deployed app
 * behave identically: short-lived response caching plus in-flight request
 * dedup, so the ~15s client poll (and multiple concurrent tabs/users) reuse
 * one upstream ESPN fetch instead of each triggering their own.
 */

export const ESPN_HOSTS = new Set(["site.api.espn.com", "sports.core.api.espn.com"]);

const LIVE_CACHE_MS = 8_000;
const STATIC_CACHE_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 1_000;

export const ESPN_LIVE_CACHE_SECONDS = LIVE_CACHE_MS / 1000;
export const ESPN_STATIC_CACHE_SECONDS = STATIC_CACHE_MS / 1000;

export function isLiveEspnPath(pathname: string) {
  return pathname.includes("scoreboard") || pathname.includes("summary");
}

export class UnsupportedEspnHostError extends Error {
  constructor() {
    super("Unsupported ESPN host");
    this.name = "UnsupportedEspnHostError";
  }
}

interface CachedResponse {
  status: number;
  contentType: string;
  body: Buffer;
  expiresAt: number;
}

export interface EspnProxyResponse {
  status: number;
  contentType: string;
  body: Buffer;
  cacheStatus: "hit" | "miss";
  cacheControl: string;
}

const responseCache = new Map<string, CachedResponse>();
const inFlightRequests = new Map<string, Promise<CachedResponse>>();

// The client appends a `liveRefresh` cache-busting timestamp to every
// scoreboard/summary URL (a leftover from when responses were never
// cached). Strip it when computing the cache key so repeated polls for the
// same resource actually hit the cache instead of each being a unique key.
function cacheKeyFor(target: URL) {
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

async function fetchWithRetry(target: URL, signal: AbortSignal, maxAttempts = 3) {
  let lastError: unknown;
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

async function fetchFromEspn(target: URL, isLiveScoreRequest: boolean): Promise<CachedResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), isLiveScoreRequest ? 12_000 : 15_000);
  try {
    const response = await fetchWithRetry(target, controller.signal, isLiveScoreRequest ? 1 : 3);
    const body = Buffer.from(await response.arrayBuffer());
    return {
      status: response.status,
      contentType: response.headers.get("content-type") || "application/json",
      body,
      expiresAt: Date.now() + (isLiveScoreRequest ? LIVE_CACHE_MS : STATIC_CACHE_MS),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** rawTarget is the `host/path?query` portion after `/api/espn/`, unescaped. */
export async function proxyEspnRequest(rawTarget: string): Promise<EspnProxyResponse> {
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
      cacheControl: `public, max-age=${Math.max(1, Math.ceil((cached.expiresAt - Date.now()) / 1000))}`,
    };
  }

  let pending = inFlightRequests.get(key);
  if (!pending) {
    pending = fetchFromEspn(target, isLiveScoreRequest);
    inFlightRequests.set(key, pending);
    pending.finally(() => inFlightRequests.delete(key));
  }
  const entry = await pending;

  // Only cache genuinely successful upstream responses, so a transient
  // ESPN error doesn't get pinned in the cache for the full TTL.
  if (entry.status < 500) {
    responseCache.set(key, entry);
    pruneExpiredCacheEntries();
  }

  return {
    status: entry.status,
    contentType: entry.contentType,
    body: entry.body,
    cacheStatus: "miss",
    cacheControl: isLiveScoreRequest ? `public, max-age=${LIVE_CACHE_MS / 1000}` : `public, max-age=${STATIC_CACHE_MS / 1000}, stale-while-revalidate=3600`,
  };
}
