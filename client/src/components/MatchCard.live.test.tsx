// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MatchCard } from "./MatchCard";
import { normalizeMalawiMatch } from "@/lib/malawi";
import type { AppSettings } from "@/lib/types";

afterEach(cleanup);

const settings: AppSettings = { prefix: "$", outputStyle: "line", viaCredits: true, selectedSlugs: ["malawi.super-league"], pinnedTeamIds: [], displayTimezone: "cat", notifications: { enabled: false, competitionSlugs: [], teamIds: [], eventTypes: ["goal", "full-time"], quietHoursEnabled: false, quietHoursStart: "22:00", quietHoursEnd: "07:00", pauseAll: false, digestEnabled: false, digestTime: "08:00" } };

const liveMalawi = normalizeMalawiMatch({ id: "abc12345", kickoff: Date.now(), date: "2026-08-16", time: "13:30", round: "Super League", home: "Blue Eagles", away: "Civo Utd", homeScore: 1, awayScore: 0, status: "live" });

describe("live score emphasis and Malawi artwork", () => {
  it("renders an accessible LIVE marker for in-progress matches", () => {
    render(<MatchCard match={liveMalawi} settings={settings} />);
    expect(screen.getByRole("status", { name: "Live match" })).toBeTruthy();
    expect(screen.getByText("LIVE")).toBeTruthy();
  });

  it("maps verified Malawi crest assets to known teams", () => {
    expect(liveMalawi.home.logo).toContain("blue-eagles");
    expect(liveMalawi.away.logo).toContain("civo-united");
  });
});
