/**
 * FootyScores Pro — Matchday Ledger ESPN client.
 * Browser-only ESPN fetches, dynamic Core directory resolution, and score normalization.
 */

import {
  CAT_TIMEZONE,
  CORE_DETAIL_BASE,
  CORE_LEAGUES_URL,
  DIRECTORY_TTL_MS,
  SCOREBOARD_BASE,
  STORAGE,
} from "./constants";
import type { Competition, Goal, Match, MatchStatus, Team } from "./types";
import { FALLBACK_COMPETITIONS } from "./fallback-competitions";
import { curatedEspnCompetitionLogo, officialCompetitionLogo } from "./official-competition-logos";
import { fetchMalawiGoals, fetchMalawiMatches, MALAWI_COMPETITION, MALAWI_SLUG } from "./malawi";

type UnknownRecord = Record<string, any>;

const regionRules: Array<[RegExp, string]> = [
  [/^eng\./, "England"],
  [/^esp\./, "Spain"],
  [/^ger\./, "Germany"],
  [/^ita\./, "Italy"],
  [/^fra\./, "France"],
  [/^ned\./, "Netherlands"],
  [/^por\./, "Portugal"],
  [/^bel\./, "Belgium"],
  [/^sco\./, "Scotland"],
  [/^irl\./, "Ireland"],
  [/^usa\.|^ncaaf\./, "United States"],
  [/^mex\./, "Mexico"],
  [/^bra\./, "Brazil"],
  [/^arg\./, "Argentina"],
  [/^col\./, "Colombia"],
  [/^chi\./, "Chile"],
  [/^uru\./, "Uruguay"],
  [/^jpn\./, "Japan"],
  [/^chn\./, "China"],
  [/^kor\./, "South Korea"],
  [/^aus\./, "Australia"],
  [/^ksa\./, "Saudi Arabia"],
  [/^uefa\./, "UEFA"],
  [/^caf\./, "Africa / CAF"],
  [/^concacaf\./, "CONCACAF"],
  [/^conmebol\./, "CONMEBOL"],
  [/^fifa\./, "International / FIFA"],
];

function str(value: unknown) {
  return String(value ?? "").trim();
}

async function fetchJson<T>(url: string, attempts = 2, timeoutMs = 15_000): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export function regionFor(slug: string) {
  return regionRules.find(([pattern]) => pattern.test(slug))?.[1] ?? "International";
}

export function logoUrl(alternateId?: string) {
  return alternateId ? `https://a.espncdn.com/i/leaguelogos/soccer/500/${alternateId}.png` : undefined;
}

export function resolveCompetitionLogo(competition: Competition): Competition {
  const curatedLogo = curatedEspnCompetitionLogo(competition.slug);
  const officialLogo = officialCompetitionLogo(competition.slug);
  const hasAuthoritativeLogo = Boolean(competition.logo && !/\/teamlogos\/soccer\/500\//i.test(competition.logo));
  if (hasAuthoritativeLogo) return competition;
  if (curatedLogo) return { ...competition, logo: curatedLogo };
  if (officialLogo) return { ...competition, logo: officialLogo };
  return !competition.alternateId ? competition : { ...competition, logo: logoUrl(competition.alternateId) };
}

export function logoFromPayload(raw: UnknownRecord): string | undefined {
  const candidates = [
    raw.competitions?.[0]?.logos?.[0]?.href,
    raw.competitions?.[0]?.logos?.[0]?.url,
    raw.competitions?.[0]?.logo,
    raw.league?.logos?.[0]?.href,
    raw.league?.logos?.[0]?.url,
    raw.league?.logo,
    raw.leagues?.[0]?.logos?.[0]?.href,
    raw.leagues?.[0]?.logos?.[0]?.url,
    raw.leagues?.[0]?.logo,
    raw.logos?.[0]?.href,
    raw.logos?.[0]?.url,
    raw.__espnCompetitionLogo,
  ];
  const logo = candidates.map(str).find((value) => /^https?:\/\//i.test(value) && !/default-team-logo|\/teamlogos\/soccer\//i.test(value));
  return logo || undefined;
}

function competitionForEvent(competition: Competition, raw: UnknownRecord, summary?: UnknownRecord): Competition {
  const summaryCompetition = summary?.header?.competitions?.[0] || {};
  const logo = logoFromPayload(summaryCompetition) || logoFromPayload(raw);
  return logo ? { ...competition, logo } : resolveCompetitionLogo(competition);
}

function withCompetitionLogos(competitions: Competition[]) {
  const normalized = competitions.map(resolveCompetitionLogo);
  return normalized.some((competition) => competition.slug === MALAWI_SLUG)
    ? normalized
    : [...normalized, MALAWI_COMPETITION];
}

function createCompetition(raw: UnknownRecord, fallbackSlug?: string): Competition | null {
  const slug = str(raw.slug || raw.id || fallbackSlug).replace(/^soccer\//, "");
  if (!slug || slug.includes("/")) return null;
  const alternateId = str(raw.alternateId || raw.uid?.split(":").at(-1)) || undefined;
  return {
    slug,
    name: str(raw.displayName || raw.name || raw.shortName || slug),
    region: regionFor(slug),
    alternateId,
    logo: logoFromPayload(raw) || curatedEspnCompetitionLogo(slug) || officialCompetitionLogo(slug) || logoUrl(alternateId),
  };
}

interface DirectoryCache {
  savedAt: number;
  competitions: Competition[];
}

function loadDirectoryCache(): Competition[] | null {
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE.directory) || "null") as DirectoryCache | null;
    if (cached && Date.now() - cached.savedAt < DIRECTORY_TTL_MS && Array.isArray(cached.competitions)) {
      return cached.competitions;
    }
  } catch {
    // Treat malformed user storage as expired cache.
  }
  return null;
}

function saveDirectoryCache(competitions: Competition[]) {
  localStorage.setItem(STORAGE.directory, JSON.stringify({ savedAt: Date.now(), competitions } satisfies DirectoryCache));
}

async function fetchLeagueDetail(refOrSlug: string): Promise<Competition | null> {
  const slugFromRef = decodeURIComponent(refOrSlug).match(/leagues\/([^?/#]+)/)?.[1];
  const slug = slugFromRef || refOrSlug;
  const url = `${CORE_DETAIL_BASE}/${encodeURIComponent(slug)}?lang=en&region=us`;
  return createCompetition(await fetchJson<UnknownRecord>(url), slug);
}

async function mapPool<T, R>(items: T[], limit: number, mapper: (value: T) => Promise<R>) {
  const output: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return output;
}

type LeagueEntry = { $ref?: string; id?: string; slug?: string };
interface LeagueListPage {
  items?: LeagueEntry[];
  pageIndex?: number;
  pageCount?: number;
}

/**
 * ESPN's Core API paginates this endpoint. A single request only returns
 * page 1 — if the collection has more pages than fit in one response, the
 * remaining leagues were previously silently dropped, which is why search
 * couldn't find some competitions no matter what you typed. This walks
 * every page and aggregates the full set before building the directory.
 */
async function fetchAllLeagueEntries(): Promise<LeagueEntry[]> {
  const separator = CORE_LEAGUES_URL.includes("?") ? "&" : "?";
  const first = await fetchJson<LeagueListPage>(`${CORE_LEAGUES_URL}${separator}page=1`);
  const entries = [...(first.items || [])];
  const pageCount = Math.max(1, first.pageCount || 1);
  if (pageCount > 1) {
    const remainingPages = Array.from({ length: pageCount - 1 }, (_, index) => index + 2);
    const morePages = await mapPool(remainingPages, 4, async (page) => {
      try {
        const data = await fetchJson<LeagueListPage>(`${CORE_LEAGUES_URL}${separator}page=${page}`);
        return data.items || [];
      } catch {
        // A single missing page shouldn't sink the whole directory — the
        // rest of the leagues are still worth surfacing.
        return [];
      }
    });
    morePages.forEach((items) => entries.push(...items));
  }
  return entries;
}

export async function getDirectory(options?: { force?: boolean }): Promise<Competition[]> {
  const cached = !options?.force ? loadDirectoryCache() : null;
  if (cached)       return withCompetitionLogos(cached);

  let entries: LeagueEntry[];
  try {
    entries = await fetchAllLeagueEntries();
  } catch {
    return withCompetitionLogos(FALLBACK_COMPETITIONS);
  }
  const details = await mapPool(entries, 8, async (entry) => {
    try {
      return await fetchLeagueDetail(str(entry.$ref || entry.slug || entry.id));
    } catch {
      return null;
    }
  });
  const competitions = details
    .filter((entry): entry is Competition => Boolean(entry))
    .sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));
  if (!competitions.length) return withCompetitionLogos(FALLBACK_COMPETITIONS);
  saveDirectoryCache(competitions);
  // Malawi Super League isn't part of ESPN's own leagues list (it's scraped
  // separately from Flashscore), so it has to be appended here explicitly —
  // this was previously only happening on the cached/fallback paths, so a
  // freshly fetched directory would silently drop it from the browsable list.
  return withCompetitionLogos(competitions);
}

export function catTime(iso: string, withSeconds = false) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CAT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  return withSeconds ? `${get("hour")}:${get("minute")}:${get("second")}` : `${get("hour")}:${get("minute")}`;
}

export function catDateKey(input: Date | string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(typeof input === "string" ? new Date(input) : input);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}${get("month")}${get("day")}`;
}

export function offsetDateKey(key: string, offset: number) {
  const date = new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(4, 6)) - 1, Number(key.slice(6, 8)), 12));
  date.setUTCDate(date.getUTCDate() + offset);
  return catDateKey(date);
}

export function catDayName(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: CAT_TIMEZONE, weekday: "short" }).format(new Date(iso));
}

export function catDateLabel(dateKey: string, short = false) {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(4, 6)) - 1;
  const day = Number(dateKey.slice(6, 8));
  const date = new Date(Date.UTC(year, month, day, 12));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CAT_TIMEZONE,
    weekday: short ? "short" : "long",
    day: "numeric",
    month: short ? "short" : "long",
  }).format(date);
}

function statusFrom(raw: UnknownRecord): MatchStatus {
  const type = raw.status?.type || {};
  const state = str(type.state).toLowerCase();
  const name = str(type.name).toLowerCase();
  const detail = str(type.detail || type.shortDetail).toLowerCase();
  if (name.includes("postponed") || detail.includes("postponed")) return "postponed";
  if (name.includes("canceled") || name.includes("cancelled") || detail.includes("cancel")) return "canceled";
  if (state === "in" || state === "live") return "live";
  if (state === "post" || name.includes("final") || detail === "ft") return "finished";
  return "upcoming";
}

function getCompetitors(raw: UnknownRecord) {
  const competitors = raw.competitions?.[0]?.competitors || [];
  const home = competitors.find((team: UnknownRecord) => team.homeAway === "home") || competitors[0] || {};
  const away = competitors.find((team: UnknownRecord) => team.homeAway === "away") || competitors[1] || {};
  return { home, away };
}

function normalizeTeam(raw: UnknownRecord): Team {
  const team = raw.team || {};
  const numeric = Number(raw.score);
  return {
    id: str(team.id) || undefined,
    name: str(team.displayName || team.name || raw.displayName || "TBD"),
    shortName: str(team.shortDisplayName || team.abbreviation || team.displayName || team.name || "TBD"),
    score: raw.score === undefined || raw.score === null || raw.score === "" || Number.isNaN(numeric) ? null : numeric,
    logo: str(team.logo || team.logos?.[0]?.href) || undefined,
  };
}

function minuteFrom(play: UnknownRecord) {
  const display = str(play.clock?.displayValue || play.displayValue || "").replace(/[’']/g, "");
  const match = display.match(/(\d+)(?:\s*\+\s*(\d+))?/);
  if (match) return match[2] ? `${match[1]}+${match[2]}` : match[1];
  return "—";
}

function cleanScorer(value: string) {
  return value
    .replace(/^\s*(goal|penalty)\s*!?\s*/i, "")
    .replace(/\s+scores?\b.*$/i, "")
    .trim();
}

function scorerFrom(play: UnknownRecord) {
  const athlete = play.participants?.[0]?.athlete || play.scoringPlay?.participants?.[0]?.athlete;
  if (athlete?.displayName) return str(athlete.displayName);
  const text = str(play.text || play.shortText || play.description);
  const named = text.match(/(?:Goal!?\s*|Penalty!?\s*)([\wÀ-ž.'’\- ]+?)(?:\s*\(|\s+scores?\b|\s+with\b|\s+from\b|\.|$)/i);
  if (named?.[1]) return cleanScorer(named[1]);
  const scorer = text.match(/^([\wÀ-ž.'’\- ]+?)\s+(?:scores?|equalises?|puts|makes)\b/i);
  return scorer?.[1]?.trim() || "Unknown";
}

function isShootoutPlay(play: UnknownRecord) {
  const type = str(play.type?.text || play.type?.type || play.type?.name || play.type).toLowerCase();
  const text = str(play.text || play.shortText || play.description).toLowerCase();
  const period = Number(play.period?.number || play.period || 0);
  return /shoot[ -]?out|penalty shoot/.test(`${type} ${text}`) || (period >= 5 && type.includes("penalty"));
}

function isGoalPlay(play: UnknownRecord) {
  const type = str(play.type?.text || play.type?.type || play.type?.name || play.type).toLowerCase();
  const text = str(play.text || play.shortText || play.description).toLowerCase();
  const description = `${type} ${text}`;
  const missed = /\b(missed|miss|saved|wide|off target|failed|misses)\b/.test(description);
  if (missed || isShootoutPlay(play)) return false;
  if (type.includes("goal") || /\bgoal!?\b|\bscores?\b/.test(text)) return true;
  if (type.includes("penalty") && (play.scoringPlay === true || /\b(scored|converted|made)\b/.test(description))) return true;
  return false;
}

function inferSide(play: UnknownRecord, home: Team, away: Team): "home" | "away" {
  const id = str(play.team?.id || play.teamId || play.participants?.[0]?.team?.id);
  if (id && id === home.id) return "home";
  if (id && id === away.id) return "away";
  const text = str(play.text || play.shortText || play.description).toLowerCase();
  if (home.name && text.includes(home.name.toLowerCase())) return "home";
  if (away.name && text.includes(away.name.toLowerCase())) return "away";
  return "home";
}

function normalizeGoals(rawPlays: UnknownRecord[], home: Team, away: Team, reconcileToScore = false): Goal[] {
  const goals = rawPlays
    .filter(isGoalPlay)
    .map((play, index) => {
      const text = str(play.text || play.shortText || play.description).toLowerCase();
      const isOwn = /own goal|own-goal/.test(text);
      const isPenalty = !isOwn && /penalty/.test(text);
      return {
        id: str(play.id || `${minuteFrom(play)}-${index}`),
        minute: minuteFrom(play),
        scorer: scorerFrom(play),
        side: inferSide(play, home, away),
        type: isOwn ? "own-goal" : isPenalty ? "penalty" : "goal",
      } satisfies Goal;
    });
  if (!reconcileToScore) return goals;

  const expected = { home: home.score, away: away.score };
  const used = { home: 0, away: 0 };
  return goals.filter((goal) => {
    const target = expected[goal.side];
    if (target === null || target === undefined || !Number.isFinite(target)) return true;
    if (used[goal.side] >= target) return false;
    used[goal.side] += 1;
    return true;
  });
}

function penaltiesFrom(raw: UnknownRecord, home: Team, away: Team) {
  const competitors = raw.competitors || raw.competitions?.[0]?.competitors || [];
  const homeRaw = competitors.find((team: UnknownRecord) => team.homeAway === "home") || {};
  const awayRaw = competitors.find((team: UnknownRecord) => team.homeAway === "away") || {};
  const toNumber = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const h = toNumber(homeRaw.shootoutScore ?? homeRaw.penaltyScore ?? raw.shootout?.home?.score);
  const a = toNumber(awayRaw.shootoutScore ?? awayRaw.penaltyScore ?? raw.shootout?.away?.score);
  if (h !== null && a !== null) return { home: h, away: a };
  const detail = str(raw.status?.type?.detail || raw.status?.type?.shortDetail || raw.competitions?.[0]?.status?.type?.detail || raw.competitions?.[0]?.status?.type?.shortDetail);
  const pair = detail.match(/(?:pens?|penalties)\s*\(?([0-9]+)\s*[-–]\s*([0-9]+)\)?/i);
  return pair ? { home: Number(pair[1]), away: Number(pair[2]) } : undefined;
}

export function normalizeMatch(raw: UnknownRecord, competition: Competition, summary?: UnknownRecord): Match {
  const resolvedCompetition = competitionForEvent(competition, raw, summary);
  const { home: homeRaw, away: awayRaw } = getCompetitors(raw);
  const home = normalizeTeam(homeRaw);
  const away = normalizeTeam(awayRaw);
  const plays = summary?.keyEvents || summary?.scoringPlays || raw.scoringPlays || [];
  const source = summary?.header?.competitions?.[0] || raw;
  const type = raw.status?.type || {};
  const status = statusFrom(raw);
  const statusDetail = str(type.detail || type.shortDetail || "Scheduled");
  const directSummaryLogo = logoFromPayload(summary?.header?.competitions?.[0] || {});
  return {
    id: str(raw.id),
    competition: resolvedCompetition,
    date: str(raw.date),
    home,
    away,
    status,
    rawState: str(type.state),
    statusDetail,
    shortDetail: str(type.shortDetail || statusDetail),
    kickoff: catTime(str(raw.date)),
    clock: str(raw.status?.displayClock || raw.status?.clock?.displayValue) || undefined,
    period: Number(raw.status?.period || raw.status?.period?.number) || undefined,
    goals: normalizeGoals(Array.isArray(plays) ? plays : [], home, away, status === "finished"),
    venue: str(summary?.gameInfo?.venue?.fullName || raw.competitions?.[0]?.venue?.fullName) || undefined,
    isOvertime: /aet|extra time|after extra/i.test(statusDetail),
    penalties: penaltiesFrom(source, home, away),
    provenance: {
      scoreboard: "espn-live",
      summary: summary ? "espn-live" : "unavailable",
      competition: directSummaryLogo ? "espn-live" : competition.logo ? "curated" : "fallback",
      logo: directSummaryLogo ? "espn-live" : competition.logo ? "curated" : "initials",
      fetchedAt: Date.now(),
    },
  };
}

export async function fetchScoreboard(competition: Competition, dateKey: string): Promise<UnknownRecord[]> {
  const data = await fetchJson<{ events?: UnknownRecord[]; leagues?: UnknownRecord[] }>(`${SCOREBOARD_BASE}/${competition.slug}/scoreboard?dates=${dateKey}&limit=300&liveRefresh=${Date.now()}`, 0, 12_000);
  const leagueLogo = logoFromPayload({ leagues: data.leagues });
  return (data.events || []).map((event) => leagueLogo ? { ...event, __espnCompetitionLogo: leagueLogo } : event);
}

/** Keep successful date windows even if the midnight supplement fails. */
export function mergeScoreboardBatches(results: Array<PromiseSettledResult<UnknownRecord[]>>) {
  const unique = new Map<string, UnknownRecord>();
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.forEach((raw) => {
      const id = str(raw.id);
      if (id) unique.set(id, raw);
    });
  });
  return Array.from(unique.values());
}

export async function fetchSummary(slug: string, eventId: string) {
  return fetchJson<UnknownRecord>(`${SCOREBOARD_BASE}/${slug}/summary?event=${encodeURIComponent(eventId)}&liveRefresh=${Date.now()}`);
}

/**
 * A match only needs its (expensive, per-match) summary re-fetched when
 * something about it could actually have changed since the last poll:
 * finished matches with goal detail already captured are done for good,
 * and a still-live match whose score/clock state hasn't moved doesn't need
 * re-enrichment either. This is what turns "N summary calls every 15s" into
 * "N summary calls once per match, then only on an actual score change".
 */
export function alreadyFullyEnriched(previous: Match | undefined, current: Match): boolean {
  const previousSummary = previous?.provenance?.summary;
  if (!previous || (previousSummary !== "espn-live" && previousSummary !== "malawi-live")) return false;
  if (previous.status === "finished" && current.status === "finished") return true;
  return (
    previous.status === "live" &&
    current.status === "live" &&
    previous.rawState === current.rawState &&
    previous.home.score === current.home.score &&
    previous.away.score === current.away.score
  );
}

async function enrichMatches(matches: Match[], rawMatches: UnknownRecord[], previousById: Map<string, Match>) {
  const rawById = new Map(rawMatches.map((raw) => [str(raw.id), raw]));
  const reused = new Map<string, Match>();
  const toFetch: Match[] = [];

  matches.forEach((match) => {
    if (match.status !== "live" && match.status !== "finished") return;
    const previous = previousById.get(match.id);
    if (alreadyFullyEnriched(previous, match)) {
      reused.set(match.id, { ...match, goals: previous!.goals, venue: match.venue || previous!.venue, provenance: previous!.provenance });
    } else {
      toFetch.push(match);
    }
  });

  if (!toFetch.length) return matches.map((match) => reused.get(match.id) || match);

  const enrichment = mapPool(toFetch, 6, async (match) => {
    try {
      const summary = await fetchSummary(match.competition.slug, match.id);
      const raw = rawById.get(match.id);
      return raw ? normalizeMatch(raw, match.competition, summary) : match;
    } catch {
      return match;
    }
  });
  // Scoreboard data is useful even when a large summary endpoint is slow. Never
  // hold the entire Matchday desk hostage to scorer enrichment.
  const results = await Promise.race([
    enrichment,
    new Promise<Match[]>((resolve) => setTimeout(() => resolve(toFetch), 4000)),
  ]);
  const enriched = new Map(results.map((match) => [match.id, match]));
  return matches.map((match) => enriched.get(match.id) || reused.get(match.id) || match);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

export async function loadMatches(competitions: Competition[], dateKey: string, previousMatches: Match[] = []) {
  const previousById = new Map(previousMatches.map((match) => [match.id, match]));
  const malawiCompetitions = competitions.filter((competition) => competition.slug === MALAWI_SLUG);
  const espnCompetitions = competitions.filter((competition) => competition.slug !== MALAWI_SLUG);
  const dateKeys = [offsetDateKey(dateKey, -1), dateKey];
  const [malawiSettled, settled] = await Promise.all([
    Promise.allSettled(malawiCompetitions.map(() => withTimeout(fetchMalawiMatches(dateKey), 6_000, []))),
    Promise.allSettled(
      espnCompetitions.map(async (competition) => {
        const batches = await Promise.allSettled(dateKeys.map((key) => fetchScoreboard(competition, key)));
        return { competition, events: mergeScoreboardBatches(batches) };
      }),
    ),
  ]);
  const malawiMatches = malawiSettled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const rawMatches: UnknownRecord[] = [];
  const normalized: Match[] = [];
  const errors: string[] = [];
  settled.forEach((result) => {
    if (result.status === "fulfilled") {
      result.value.events.forEach((raw) => {
        const rawDate = str(raw.date);
        if (rawDate && catDateKey(rawDate) !== dateKey) return;
        rawMatches.push(raw);
        normalized.push(normalizeMatch(raw, result.value.competition));
      });
    } else {
      errors.push(result.reason instanceof Error ? result.reason.message : "A competition could not be loaded.");
    }
  });
  const matches = await enrichMatches(normalized, rawMatches, previousById);
  const enrichedMalawi = await Promise.all(malawiMatches.map(async (match) => {
    if (match.status !== "live" && match.status !== "finished") return match;
    const previous = previousById.get(match.id);
    if (alreadyFullyEnriched(previous, match)) {
      return { ...match, goals: previous!.goals, provenance: previous!.provenance };
    }
    try {
      return {
        ...match,
        goals: await Promise.race([
          withTimeout(fetchMalawiGoals(match.id), 2_500, match.goals || []),
        ]),
        provenance: {
          scoreboard: "malawi-live" as const,
          summary: "malawi-live" as const,
          competition: "malawi-live" as const,
          logo: "initials" as const,
          fetchedAt: Date.now(),
        },
      };
    } catch {
      return match;
    }
  }));
  return { matches: [...matches, ...enrichedMalawi], errors };
}
