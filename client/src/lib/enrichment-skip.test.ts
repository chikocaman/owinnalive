import { describe, expect, it } from "vitest";
import { alreadyFullyEnriched } from "./espn";
import type { Match } from "./types";

const competition = { slug: "esp.1", name: "LaLiga", region: "Spain" };

function match(overrides: Partial<Match>): Match {
  return {
    id: "fixture-1",
    competition,
    date: "2026-08-16T18:00:00Z",
    home: { name: "Home FC", shortName: "HFC", score: 1 },
    away: { name: "Away FC", shortName: "AFC", score: 0 },
    status: "live",
    rawState: "in",
    statusDetail: "45'",
    shortDetail: "45'",
    kickoff: "20:00",
    goals: [],
    isOvertime: false,
    provenance: {
      scoreboard: "espn-live",
      summary: "espn-live",
      competition: "espn-live",
      logo: "espn-live",
      fetchedAt: Date.now(),
    },
    ...overrides,
  };
}

describe("alreadyFullyEnriched", () => {
  it("skips re-enrichment when a live match's score hasn't changed", () => {
    const previous = match({});
    const current = match({});
    expect(alreadyFullyEnriched(previous, current)).toBe(true);
  });

  it("requires re-enrichment when the score has changed", () => {
    const previous = match({});
    const current = match({ home: { name: "Home FC", shortName: "HFC", score: 2 } });
    expect(alreadyFullyEnriched(previous, current)).toBe(false);
  });

  it("never re-enriches a finished match that was already enriched", () => {
    const previous = match({ status: "finished" });
    const current = match({ status: "finished", home: { name: "Home FC", shortName: "HFC", score: 3 } });
    expect(alreadyFullyEnriched(previous, current)).toBe(true);
  });

  it("requires enrichment when there is no previous match", () => {
    expect(alreadyFullyEnriched(undefined, match({}))).toBe(false);
  });

  it("requires enrichment when the previous match was never successfully enriched", () => {
    const previous = match({ provenance: { scoreboard: "espn-live", summary: "unavailable", competition: "espn-live", logo: "initials" } });
    expect(alreadyFullyEnriched(previous, match({}))).toBe(false);
  });
});
