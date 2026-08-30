import type { Competition, Goal, Match, Team } from "./types";

export const MALAWI_SLUG = "malawi.super-league";
export const MALAWI_COMPETITION: Competition = {
  slug: MALAWI_SLUG,
  name: "Malawi Super League",
  region: "Malawi",
  aliases: ["malawi league", "super league malawi", "malawi super league", "mws l"],
};

type MalawiRecord = {
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

type MalawiGoalRecord = {
  id: string;
  team: "home" | "away";
  minute: string;
  player: string;
  kind: "goal" | "penalty";
};

async function fetchMalawiJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 6_000);
  try {
    const response = await fetch(path, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`Malawi source unavailable (${response.status})`);
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

const MALAWI_TEAM_LOGOS: Record<string, string> = {
  "blue eagles": "/manus-storage/blue-eagles_f9843c8b.png",
  "civo utd": "/manus-storage/civo-united_8df30af5.png",
  "civo united": "/manus-storage/civo-united_8df30af5.png",
  "dedza dynamos": "/manus-storage/dedza-dynamos_5abf769b.jpg",
  "mighty wanderers": "/manus-storage/mighty-wanderers_d596c3d7.png",
  "mighty mukuru wanderers": "/manus-storage/mighty-wanderers_d596c3d7.png",
  "big bullets": "/manus-storage/big-bullets_ef1b4ac3.png",
};

function team(name: string, score: number | null): Team {
  const logo = MALAWI_TEAM_LOGOS[name.trim().toLowerCase()];
  return { name, shortName: name, score, ...(logo ? { logo } : {}) };
}

export function normalizeMalawiMatch(raw: MalawiRecord, goals: Goal[] = []): Match {
  const status = raw.status === "live" ? "live" : raw.status === "finished" ? "finished" : "upcoming";
  return {
    id: `malawi-${raw.id}`,
    competition: MALAWI_COMPETITION,
    date: raw.date,
    home: team(raw.home, raw.homeScore),
    away: team(raw.away, raw.awayScore),
    status,
    rawState: raw.status,
    statusDetail: status === "live" ? "Live" : status === "finished" ? "FT" : "Scheduled",
    shortDetail: status === "live" ? "Live" : status === "finished" ? "FT" : raw.time,
    kickoff: raw.time,
    goals,
    isOvertime: false,
    provenance: {
      scoreboard: "espn-live",
      summary: goals.length ? "espn-live" : "unavailable",
      competition: "official",
      logo: MALAWI_TEAM_LOGOS[raw.home.trim().toLowerCase()] || MALAWI_TEAM_LOGOS[raw.away.trim().toLowerCase()] ? "official" : "initials",
      fetchedAt: Date.now(),
    },
  };
}

export function normalizeMalawiGoal(raw: MalawiGoalRecord, index: number): Goal {
  return {
    id: `malawi-goal-${raw.id || index}`,
    minute: raw.minute,
    scorer: raw.player,
    side: raw.team,
    type: raw.kind,
  };
}

export async function fetchMalawiMatches(dateKey: string): Promise<Match[]> {
  const data = await fetchMalawiJson<{ matches?: MalawiRecord[] }>("/api/malawi/scoreboard");
  return (data.matches || [])
    .filter((match) => match.date.replaceAll("-", "") === dateKey)
    .map((match) => normalizeMalawiMatch(match));
}

export async function fetchMalawiGoals(matchId: string): Promise<Goal[]> {
  const sourceId = matchId.replace(/^malawi-/, "");
  const data = await fetchMalawiJson<{ events?: MalawiGoalRecord[] }>(`/api/malawi/events/${encodeURIComponent(sourceId)}`);
  return (data.events || []).map(normalizeMalawiGoal);
}
