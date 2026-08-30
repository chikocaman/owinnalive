import type { Express, Request, Response } from "express";

const RESULTS_URL = "https://www.flashscore.com/football/malawi/super-league/results/";
const FIXTURES_URL = "https://www.flashscore.com/football/malawi/super-league/fixtures/";
const EVENT_URL = "https://www.flashscore.com/1/x/feed/df_sui_1_";
const MALAWI_OFFSET_MS = 2 * 60 * 60 * 1000;
const CACHE_MS = 20_000;
export const MALAWI_SCOREBOARD_CACHE_SECONDS = CACHE_MS / 1000;

const FLASH_HEADERS = {
  Accept: "text/plain, text/html, */*",
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "x-fsign": "SW9D1eZo",
  Referer: "https://www.flashscore.com/",
};

type FeedFields = Record<string, string>;
export type MalawiMatch = {
  id: string;
  kickoff: number;
  date: string;
  time: string;
  round: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "finished";
};

export type MalawiGoal = {
  id: string;
  team: "home" | "away";
  minute: string;
  player: string;
  kind: "goal" | "penalty";
};

function readFields(record: string): FeedFields {
  return record.split("¬").reduce<FeedFields>((fields, segment) => {
    const splitAt = segment.indexOf("÷");
    if (splitAt > -1) fields[segment.slice(0, splitAt)] = segment.slice(splitAt + 1);
    return fields;
  }, {});
}

export function parseMalawiMatchRecords(feed: string): MalawiMatch[] {
  const matches = new Map<string, MalawiMatch>();
  for (const record of Array.from(feed.matchAll(/AA÷([A-Za-z0-9]{8})¬([^~]*)/g))) {
    const id = record[1];
    const fields = readFields(record[2]);
    const kickoffSeconds = Number(fields.AD);
    if (!fields.CX || !fields.AF || !Number.isFinite(kickoffSeconds)) continue;
    const localDate = new Date(kickoffSeconds * 1000 + MALAWI_OFFSET_MS);
    const status = fields.AB === "3" ? "finished" : fields.AB === "2" ? "live" : "scheduled";
    const parsed: MalawiMatch = {
      id,
      kickoff: kickoffSeconds * 1000,
      date: localDate.toISOString().slice(0, 10),
      time: localDate.toISOString().slice(11, 16),
      round: fields.ER || "Super League",
      home: fields.CX,
      away: fields.AF,
      homeScore: fields.AG === undefined || fields.AG === "" ? null : Number(fields.AG),
      awayScore: fields.AH === undefined || fields.AH === "" ? null : Number(fields.AH),
      status,
    };
    const existing = matches.get(id);
    if (!existing || parsed.status === "live" || parsed.status === "finished") matches.set(id, parsed);
  }
  return Array.from(matches.values());
}

export function parseMalawiGoalEvents(feed: string): MalawiGoal[] {
  const goals: MalawiGoal[] = [];
  let active: Partial<MalawiGoal> | null = null;
  const complete = () => {
    if (active?.id && active.team && active.minute && active.player && active.kind) goals.push(active as MalawiGoal);
  };
  for (const segment of feed.split(/[¬~]/)) {
    const splitAt = segment.indexOf("÷");
    if (splitAt < 0) continue;
    const key = segment.slice(0, splitAt);
    const value = segment.slice(splitAt + 1);
    if (key === "III") {
      complete();
      active = { id: value };
    } else if (active && key === "IA") active.team = value === "1" ? "home" : "away";
    else if (active && key === "IB") active.minute = value.replace(/['’]/g, "");
    else if (active && key === "IF") active.player = value.trim();
    else if (active && key === "IK") active.kind = /penalty/i.test(value) ? "penalty" : value === "Goal" ? "goal" : undefined;
  }
  complete();
  return goals;
}

let scoreboardCache: { expiresAt: number; data: MalawiMatch[] } | null = null;
const eventsCache = new Map<string, { expiresAt: number; data: MalawiGoal[] }>();
const EVENTS_CACHE_MS = 15_000;
export const MALAWI_EVENTS_CACHE_SECONDS = EVENTS_CACHE_MS / 1000;

async function fetchText(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { headers: FLASH_HEADERS, signal: controller.signal });
    if (!response.ok) throw new Error(`Malawi source returned ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function loadMalawiScoreboard() {
  if (scoreboardCache && scoreboardCache.expiresAt > Date.now()) return scoreboardCache.data;
  const [results, fixtures] = await Promise.all([fetchText(RESULTS_URL), fetchText(FIXTURES_URL)]);
  const unique = new Map<string, MalawiMatch>();
  [...parseMalawiMatchRecords(results), ...parseMalawiMatchRecords(fixtures)].forEach((match) => {
    const existing = unique.get(match.id);
    if (!existing || match.status === "live" || match.status === "finished") unique.set(match.id, match);
  });
  const data = Array.from(unique.values()).sort((a, b) => a.kickoff - b.kickoff);
  scoreboardCache = { expiresAt: Date.now() + CACHE_MS, data };
  return data;
}

export async function loadMalawiEvents(matchId: string) {
  if (!/^[A-Za-z0-9]{8}$/.test(matchId)) throw new Error("Invalid Malawi match id");
  const cached = eventsCache.get(matchId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const data = parseMalawiGoalEvents(await fetchText(`${EVENT_URL}${matchId}`));
  eventsCache.set(matchId, { expiresAt: Date.now() + EVENTS_CACHE_MS, data });
  return data;
}

export function registerMalawiRoutes(app: Express) {
  app.get("/api/malawi/scoreboard", async (_req: Request, res: Response) => {
    try {
      const matches = await loadMalawiScoreboard();
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.json({ source: "flashscore-malawi-super-league", fetchedAt: Date.now(), matches });
    } catch (error) {
      console.error("[malawi] scoreboard failed", error);
      res.status(502).json({ error: "Malawi Super League source is temporarily unavailable" });
    }
  });

  app.get("/api/malawi/events/:matchId", async (req: Request, res: Response) => {
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
