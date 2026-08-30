// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MatchCard } from "./MatchCard";
import type { AppSettings, Match } from "@/lib/types";

afterEach(cleanup);

const settings: AppSettings = { prefix: "$", outputStyle: "line", viaCredits: true, selectedSlugs: ["eng.1"], pinnedTeamIds: [], displayTimezone: "cat", notifications: { enabled: false, competitionSlugs: [], teamIds: [], eventTypes: ["goal", "full-time", "aet", "penalties"], quietHoursEnabled: false, quietHoursStart: "22:00", quietHoursEnd: "07:00", pauseAll: false, digestEnabled: false, digestTime: "08:00" } };
const match: Match = {
  id: "match-diagnostics",
  competition: { slug: "eng.1", name: "Premier League", region: "England" },
  date: "2026-08-16T12:00:00Z",
  home: { name: "Arsenal", shortName: "ARS", score: 2 },
  away: { name: "Chelsea", shortName: "CHE", score: 1 },
  status: "finished",
  rawState: "post",
  statusDetail: "Full Time",
  shortDetail: "FT",
  kickoff: "12:00",
  goals: [],
  isOvertime: false,
  provenance: { scoreboard: "espn-live", summary: "espn-live", competition: "espn-live", logo: "curated", fetchedAt: 123 },
};

describe("MatchCard diagnostics", () => {
  it("reveals provenance only when match details are expanded", () => {
    render(<MatchCard match={match} settings={settings} />);
    expect(screen.queryByText(/Score: espn-live/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Toggle match details" }));
    expect(screen.getByText(/Score: espn-live · Events: espn-live · Competition: espn-live · Artwork: curated/)).toBeTruthy();
  });
});
