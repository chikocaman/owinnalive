import type { Match, MatchFilterState, FilterKey, CompetitionType } from "./types";
import { matchSearchText } from "./match-utils";

export function competitionGender(match: Match): "men" | "women" {
  const text = `${match.competition.name} ${match.competition.slug}`.toLocaleLowerCase();
  return /women|female|w\.\b|\.w\b|ladies/.test(text) ? "women" : "men";
}

export function competitionType(match: Match): Exclude<CompetitionType, "all"> {
  const text = `${match.competition.name} ${match.competition.slug}`.toLocaleLowerCase();
  if (/world|euro|uefa|caf|conmebol|concacaf|afc|ofc|international|nations|champions|qualif/.test(text)) return "international";
  if (/cup|copa|shield|trophy|knockout|playoff|play-off/.test(text)) return "cup";
  return "league";
}

export function competitionAgeGroup(match: Match): "senior" | "youth" {
  const text = `${match.competition.name} ${match.competition.slug}`.toLocaleLowerCase();
  return /u\s?\d+|youth|junior|juvenil|academy|reserve|olympic/.test(text) ? "youth" : "senior";
}

export function filterMatches(matches: Match[], status: FilterKey, query: string, filters: MatchFilterState) {
  const normalized = query.trim().toLocaleLowerCase();
  return matches.filter((match) => {
    if (status !== "all" && match.status !== status) return false;
    if (normalized && !matchSearchText(match).includes(normalized)) return false;
    if (filters.country !== "all" && match.competition.region !== filters.country) return false;
    if (filters.gender !== "all" && competitionGender(match) !== filters.gender) return false;
    if (filters.ageGroup !== "all" && competitionAgeGroup(match) !== filters.ageGroup) return false;
    if (filters.competitionType && filters.competitionType !== "all" && competitionType(match) !== filters.competitionType) return false;
    if (filters.team !== "all" && match.home.name !== filters.team && match.away.name !== filters.team) return false;
    if (filters.player !== "all" && !match.goals.some((goal) => goal.scorer === filters.player)) return false;
    return true;
  });
}

export function uniqueFilterValues(matches: Match[]) {
  return {
    countries: Array.from(new Set(matches.map((match) => match.competition.region))).sort(),
    teams: Array.from(new Set(matches.flatMap((match) => [match.home.name, match.away.name]))).sort(),
    players: Array.from(new Set(matches.flatMap((match) => match.goals.map((goal) => goal.scorer)))).sort(),
  };
}
