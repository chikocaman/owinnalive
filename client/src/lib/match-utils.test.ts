import { describe, expect, it } from "vitest";
import { outputLines } from "./match-utils";
import type { Match } from "./types";

const finishedShootout: Match = {
  id: "morocco-algeria",
  competition: { slug: "caf.wafcon", name: "Women AFCON", region: "CAF" },
  date: "2026-07-20T17:00:00Z",
  home: { name: "Morocco", shortName: "MAR", score: 1 },
  away: { name: "Algeria", shortName: "ALG", score: 1 },
  status: "finished",
  rawState: "post",
  statusDetail: "FT · Pens",
  shortDetail: "FT · Pens",
  kickoff: "19:00",
  goals: [
    { id: "1", minute: "37", scorer: "Kautar Azraf", side: "home", type: "goal" },
    { id: "2", minute: "83", scorer: "Lina Boussaha", side: "away", type: "goal" },
    { id: "3", minute: "90", scorer: "Nouhaila Benzina", side: "home", type: "penalty" },
  ],
  isOvertime: false,
  penalties: { home: 4, away: 2 },
};

describe("match output contract", () => {
  it("keeps straight quotes, side ordinals, via P, and shootout totals separate", () => {
    expect(outputLines(finishedShootout, { prefix: "$", style: "line", viaCredits: true })).toEqual([
      '$ home goal 1 by "Kautar Azraf" at 37',
      '$ away goal 1 by "Lina Boussaha" at 83',
      '$ home goal 2 by "Nouhaila Benzina" at 90 via P',
      "$ end match",
      "$ set penalties 4-2",
    ]);
  });

  it("uses kickoff copy for upcoming matches and emits no final-state line", () => {
    const upcoming = { ...finishedShootout, status: "upcoming" as const, kickoff: "20:30", goals: [], penalties: undefined };
    expect(outputLines(upcoming, { prefix: "$", style: "line", viaCredits: true })).toEqual(["$ match at 20:30"]);
  });
});
