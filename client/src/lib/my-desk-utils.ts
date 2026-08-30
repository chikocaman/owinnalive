import type { Match } from "@/lib/types";

export function selectMyDeskMatches(matches: Match[], pinnedTeamIds: string[], selectedCompetitionSlugs: string[]) {
  const pinned = new Set(pinnedTeamIds);
  const competitions = new Set(selectedCompetitionSlugs);
  return matches.filter((match) => pinned.has(match.home.id || match.home.name) || pinned.has(match.away.id || match.away.name) || competitions.has(match.competition.slug));
}

export function toggleNotificationCompetition(current: string[], slug: string) {
  return current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
}
