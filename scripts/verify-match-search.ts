import { buildSuggestions } from "../client/src/components/MatchFilters";
import type { Match } from "../client/src/lib/types";

const match: Match = {
  id: "fixture-1",
  competition: { slug: "caf.w.nations", name: "Women's Africa Cup of Nations", region: "Africa / CAF" },
  date: "2026-08-16T17:00:00Z",
  home: { name: "Morocco", shortName: "Morocco", score: 1 },
  away: { name: "Algeria", shortName: "Algeria", score: 1 },
  status: "finished",
  rawState: "post",
  statusDetail: "FT-Pens",
  shortDetail: "FT-Pens",
  kickoff: "19:00",
  goals: [
    { id: "goal-1", side: "home", scorer: "Kautar Azraf", minute: "37", type: "goal" },
    { id: "goal-2", side: "away", scorer: "Lina Boussaha", minute: "83", type: "goal" },
  ],
  isOvertime: false,
  penalties: { home: 2, away: 3 },
};

const assertions: Array<[string, string, string]> = [
  ["team", "morocco", "Team:morocco"],
  ["player", "azraf", "Player:kautar azraf"],
  ["competition", "africa", "Competition:women's africa cup of nations"],
];

for (const [label, query, expected] of assertions) {
  const entries = buildSuggestions([match], query);
  if (!entries.some((entry) => entry.key === expected)) throw new Error(`${label} autosuggestion missing for "${query}".`);
}

console.log("Verified selected-day autosuggestions for a team, scorer, and competition.");
