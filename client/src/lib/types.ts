/**
 * FootyScores Pro — Matchday Ledger data vocabulary.
 * All UI components consume this normalized client-side ESPN data shape.
 */

export type MatchStatus = "live" | "upcoming" | "finished" | "postponed" | "canceled";
export type OutputStyle = "line" | "combined";
export type FilterKey = "all" | MatchStatus;
export type CompetitionGender = "all" | "men" | "women";
export type CompetitionAgeGroup = "all" | "senior" | "youth";
export type CompetitionType = "all" | "league" | "cup" | "international";

export interface MatchFilterState {
  country: string;
  gender: CompetitionGender;
  ageGroup: CompetitionAgeGroup;
  competitionType: CompetitionType;
  team: string;
  player: string;
}

export interface SourceProvenance {
  scoreboard: "espn-live" | "espn-cache" | "malawi-live" | "fallback" | "unknown";
  summary: "espn-live" | "espn-cache" | "malawi-live" | "unavailable";
  competition: "espn-live" | "espn-cache" | "malawi-live" | "curated" | "official" | "fallback";
  logo: "espn-live" | "espn-cache" | "curated" | "official" | "initials";
  fetchedAt?: number;
}

export const DEFAULT_MATCH_FILTERS: MatchFilterState = {
  country: "all",
  gender: "all",
  ageGroup: "all",
  competitionType: "all",
  team: "all",
  player: "all",
};


export interface Competition {
  slug: string;
  name: string;
  region: string;
  alternateId?: string;
  logo?: string;
  aliases?: string[];
}

export interface Team {
  id?: string;
  name: string;
  shortName: string;
  score: number | null;
  logo?: string;
}

export interface Goal {
  id: string;
  minute: string;
  scorer: string;
  side: "home" | "away";
  type: "goal" | "penalty" | "own-goal";
}

export interface Match {
  id: string;
  competition: Competition;
  date: string;
  home: Team;
  away: Team;
  status: MatchStatus;
  rawState: string;
  statusDetail: string;
  shortDetail: string;
  kickoff: string;
  clock?: string;
  period?: number;
  goals: Goal[];
  venue?: string;
  isOvertime: boolean;
  penalties?: { home: number; away: number };
  provenance?: SourceProvenance;
}

export type NotificationEventType = "goal" | "kickoff" | "full-time" | "aet" | "penalties" | "red-card";

export interface NotificationSettings {
  enabled: boolean;
  competitionSlugs: string[];
  teamIds: string[];
  eventTypes: NotificationEventType[];
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  pauseAll: boolean;
  digestEnabled: boolean;
  digestTime: string;
}

export type DisplayTimezone = "cat" | "local";

export interface AppSettings {
  prefix: string;
  outputStyle: OutputStyle;
  viaCredits: boolean;
  selectedSlugs: string[];
  pinnedTeamIds: string[];
  displayTimezone: DisplayTimezone;
  notifications: NotificationSettings;
}

export interface DataState {
  matches: Match[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
}
