import { filterVisibleMatches } from "../client/src/components/MatchLedger";
import type { Match } from "../client/src/lib/types";

const makeMatch = (id: string, status: Match["status"], home: string, away: string, competition: string, scorer = "") : Match => ({
  id,
  competition: { slug: competition.toLowerCase().replace(/[^a-z]+/g, "-"), name: competition, region: "Test" },
  date: "2026-08-16T12:00:00Z",
  home: { name: home, shortName: home, score: status === "finished" ? 2 : 0 },
  away: { name: away, shortName: away, score: status === "finished" ? 1 : 0 },
  status,
  rawState: status === "upcoming" ? "pre" : status === "live" ? "in" : "post",
  statusDetail: status,
  shortDetail: status,
  kickoff: "17:00",
  goals: scorer ? [{ id: `${id}-goal`, side: "home", scorer, minute: "42", type: "goal" }] : [],
  isOvertime: false,
});

const matches = [
  makeMatch("1", "upcoming", "Racing Santander", "Villarreal", "LaLiga"),
  makeMatch("2", "upcoming", "Bayern Munich", "Dortmund", "Bundesliga"),
  makeMatch("3", "live", "Arsenal", "Chelsea", "Premier League", "Bukayo Saka"),
  makeMatch("4", "finished", "Morocco", "Algeria", "Women's Africa Cup of Nations", "Kautar Azraf"),
];

const expectCount = (label: string, actual: number, expected: number) => {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, received ${actual}`);
};

expectCount("team search", filterVisibleMatches(matches, "all", "Bayern").length, 1);
expectCount("scorer search", filterVisibleMatches(matches, "all", "Saka").length, 1);
expectCount("competition search", filterVisibleMatches(matches, "all", "Africa Cup").length, 1);
expectCount("upcoming filter", filterVisibleMatches(matches, "upcoming", "").length, 2);
expectCount("live filter", filterVisibleMatches(matches, "live", "").length, 1);
expectCount("finished filter", filterVisibleMatches(matches, "finished", "").length, 1);
expectCount("combined filter and query", filterVisibleMatches(matches, "upcoming", "Dortmund").length, 1);
expectCount("non-match query", filterVisibleMatches(matches, "all", "Barcelona").length, 0);

console.log("Verified match-only team, scorer, competition, status, combined, and empty-search behavior.");
