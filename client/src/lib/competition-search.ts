/**
 * FootyScores Pro — Matchday Ledger competition discovery.
 * Accent-safe word matching plus football-specific acronym expansion keeps directory search forgiving.
 */

import type { Competition } from "./types";

const ACRONYMS: Record<string, string[]> = {
  wafcon: ["women", "africa", "cup", "nations"],
  afcon: ["africa", "cup", "nations"],
  ucl: ["champions", "league"],
  cl: ["champions", "league"],
  el: ["europa", "league"],
  ecl: ["conference", "league"],
  wwc: ["women", "world", "cup"],
  wc: ["world", "cup"],
  cwc: ["club", "world", "cup"],
  pl: ["premier", "league"],
  bl: ["bundesliga"],
  l1: ["ligue", "one"],
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/women'?s/g, "women")
    .replace(/under\s*[- ]?([0-9]{1,2})/g, "u$1")
    .replace(/u\s*[- ]?([0-9]{1,2})/g, "u$1")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function words(value: string) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function tokenMatches(token: string, haystack: string[]) {
  if (/^u\d{1,2}$/.test(token)) return haystack.some((word) => word === token);
  return haystack.some((word) => word.startsWith(token) || token.startsWith(word));
}

export function matchesCompetition(competition: Competition, query: string) {
  const queryTokens = words(query);
  if (!queryTokens.length) return true;
  const searchable = words([competition.name, competition.region, competition.slug, ...(competition.aliases || [])].join(" "));
  return queryTokens.every((token) => {
    const expansion = ACRONYMS[token];
    return expansion ? expansion.every((need) => tokenMatches(need, searchable)) : tokenMatches(token, searchable);
  });
}

export function groupCompetitions(competitions: Competition[]) {
  return competitions.reduce<Record<string, Competition[]>>((groups, competition) => {
    (groups[competition.region] ||= []).push(competition);
    return groups;
  }, {});
}
