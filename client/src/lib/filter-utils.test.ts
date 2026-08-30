import { describe, expect, it } from "vitest";
import { competitionAgeGroup, competitionGender, competitionType, filterMatches } from "./filter-utils";
import type { Match } from "./types";

const base = (overrides: Partial<Match> = {}): Match => ({
  id: "1", date: "2026-08-16", kickoff: "18:00", status: "finished", rawState: "post", statusDetail: "Full Time", shortDetail: "FT", goals: [{ id: "g1", minute: "7", scorer: "Rashford", side: "home", type: "goal" }], venue: "", isOvertime: false,
  competition: { slug: "eng.1", name: "Premier League", region: "England / UEFA" },
  home: { name: "Arsenal", shortName: "Arsenal", score: 2 }, away: { name: "Chelsea", shortName: "Chelsea", score: 1 }, ...overrides,
});

describe("structured match filters", () => {
  it("filters by country, player, and free text together", () => {
    const matches = [base(), base({ id: "2", competition: { slug: "fra.w.1", name: "Division 1 Féminine", region: "France / UEFA" }, goals: [{ id: "g2", minute: "12", scorer: "Ada", side: "away", type: "goal" }] })];
    expect(filterMatches(matches, "all", "rashford", { country: "England / UEFA", gender: "all", ageGroup: "all", team: "all", player: "Rashford" })).toHaveLength(1);
  });

  it("classifies women and youth competitions", () => {
    expect(competitionGender(base({ competition: { slug: "fra.w.1", name: "Women League", region: "France" } }))).toBe("women");
    expect(competitionAgeGroup(base({ competition: { slug: "eng.u18", name: "U18 Premier League", region: "England" } }))).toBe("youth");
    expect(competitionType(base())).toBe("league");
    expect(competitionType(base({ competition: { slug: "eng.fa", name: "FA Cup", region: "England" } }))).toBe("cup");
    expect(competitionType(base({ competition: { slug: "uefa.champions", name: "UEFA Champions League", region: "Europe" } }))).toBe("international");
  });
});
