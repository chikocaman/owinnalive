import { describe, expect, it } from "vitest";
import { normalizeMatch } from "./espn";
import type { Competition } from "./types";

const competition: Competition = { slug: "esp.1", name: "LALIGA", region: "Spain" };

function rawMatch(status: Record<string, unknown> = {}) {
  return {
    id: "goal-fixture",
    date: "2026-08-16T16:00:00Z",
    status: { type: { state: "in", name: "In Progress", detail: "45'" }, ...status },
    competitions: [{ competitors: [
      { homeAway: "home", score: "1", team: { id: "1", displayName: "Home FC" } },
      { homeAway: "away", score: "0", team: { id: "2", displayName: "Away FC" } },
    ] }],
  };
}

describe("ESPN goal event normalization", () => {
  it("reads scorer, side, minute, and penalty type from summary keyEvents", () => {
    const match = normalizeMatch(rawMatch(), competition, {
      keyEvents: [
        { id: "k1", scoringPlay: true, text: "Goal! Home FC 1, Away FC 0.", clock: { displayValue: "37'" }, type: { text: "Goal", type: "goal" }, team: { id: "1" }, participants: [{ athlete: { displayName: "A. Scorer" } }] },
        { id: "k2", scoringPlay: true, text: "Penalty! Home FC 2, Away FC 0.", clock: { displayValue: "83'" }, type: { text: "Penalty", type: "penalty" }, team: { id: "1" }, participants: [{ athlete: { displayName: "P. Taker" } }] },
      ],
    });
    expect(match.goals).toEqual([
      { id: "k1", minute: "37", scorer: "A. Scorer", side: "home", type: "goal" },
      { id: "k2", minute: "83", scorer: "P. Taker", side: "home", type: "penalty" },
    ]);
  });

  it("keeps shootout penalty events out of timed goal events", () => {
    const match = normalizeMatch(rawMatch({ type: { state: "post", name: "Final", detail: "FT · Pens" } }), competition, {
      keyEvents: [
        { id: "k1", scoringPlay: true, text: "Goal! Home FC 1, Away FC 0.", clock: { displayValue: "90+4'" }, type: { text: "Goal", type: "goal" }, team: { id: "1" }, participants: [{ athlete: { displayName: "A. Scorer" } }] },
        { id: "p1", scoringPlay: true, text: "Penalty shootout", type: { text: "Penalty Shootout", type: "penalty-shootout" }, team: { id: "1" } },
      ],
    });
    expect(match.goals).toHaveLength(1);
    expect(match.goals[0].minute).toBe("90+4");
  });
});
