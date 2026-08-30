/**
 * FootyScores Pro — Matchday Ledger configuration.
 * ESPN endpoints and local-storage keys are kept together for transparent client-only operation.
 */

import type { AppSettings, Competition } from "./types";

export const CAT_TIMEZONE = "Africa/Blantyre";
export const SCOREBOARD_BASE = "/api/espn/site.api.espn.com/apis/site/v2/sports/soccer";
export const CORE_LEAGUES_URL = "/api/espn/sports.core.api.espn.com/v2/sports/soccer/leagues?limit=500";
export const CORE_DETAIL_BASE = "/api/espn/sports.core.api.espn.com/v2/sports/soccer/leagues";
export const ESPN_SOCCER_LOGO_BASE = "https://a.espncdn.com/i/teamlogos/soccer/500";

export const STORAGE = {
  settings: "footyscores-react.settings",
  directory: "footyscores-react.directory",
  view: "footyscores-react.view",
} as const;

export const DIRECTORY_TTL_MS = 24 * 60 * 60 * 1000;
export const SCORE_REFRESH_INTERVAL_MS = 15_000;

export const DEFAULT_SETTINGS: AppSettings = {
  prefix: "$",
  outputStyle: "line",
  viaCredits: true,
  selectedSlugs: ["eng.1", "esp.1", "ger.1", "ita.1", "fra.1", "uefa.champions", "malawi.super-league"],
  pinnedTeamIds: [],
  displayTimezone: "cat",
  notifications: {
    enabled: false,
    competitionSlugs: [],
    teamIds: [],
    eventTypes: ["goal", "full-time", "aet", "penalties"],
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    pauseAll: false,
    digestEnabled: false,
    digestTime: "08:00",
  },
};

// These are preference defaults, not a competition directory. The live Core API remains the source of truth.
export const DEFAULT_COMPETITIONS: Competition[] = [
  { slug: "eng.1", name: "Premier League", region: "England" },
  { slug: "esp.1", name: "LALIGA", region: "Spain" },
  { slug: "ger.1", name: "Bundesliga", region: "Germany" },
  { slug: "ita.1", name: "Serie A", region: "Italy" },
  { slug: "fra.1", name: "Ligue 1", region: "France" },
  { slug: "uefa.champions", name: "UEFA Champions League", region: "UEFA" },
];

export const POPULAR_SLUGS = [
  "eng.1",
  "esp.1",
  "ger.1",
  "ita.1",
  "fra.1",
  "uefa.champions",
  "uefa.europa",
  "fifa.world",
  "caf.africa",
] as const;
