import { describe, expect, it } from "vitest";
import { getMatchNotifications } from "./notification-utils";
import type { Match } from "./types";

const match = (overrides: Partial<Match> = {}): Match => ({
  id: "match-1",
  competition: { slug: "eng.1", name: "Premier League", region: "England" },
  date: "2026-08-16T12:00:00Z",
  home: { name: "Arsenal", shortName: "ARS", score: 2 },
  away: { name: "Chelsea", shortName: "CHE", score: 1 },
  status: "live",
  rawState: "in",
  statusDetail: "45'",
  shortDetail: "45'",
  kickoff: "12:00",
  goals: [],
  isOvertime: false,
  ...overrides,
});

describe("getMatchNotifications", () => {
  it("returns a goal notification for a newly observed goal", () => {
    const previous = match();
    const current = match({ goals: [{ id: "g1", minute: "7", scorer: "Rashford", side: "home", type: "goal" }] });
    expect(getMatchNotifications(previous, current)).toEqual([{ kind: "goal", goalId: "g1" }]);
  });

  it("returns both the final goal and terminal notification in one refresh", () => {
    const previous = match({ status: "live" });
    const current = match({ status: "finished", goals: [{ id: "g2", minute: "90", scorer: "Saka", side: "home", type: "goal" }] });
    expect(getMatchNotifications(previous, current)).toEqual([{ kind: "goal", goalId: "g2" }, { kind: "full-time" }]);
  });

  it("does not notify when the match state is unchanged", () => {
    const current = match({ status: "finished" });
    expect(getMatchNotifications(current, current)).toEqual([]);
  });
});
