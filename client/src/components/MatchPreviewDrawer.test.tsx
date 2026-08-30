// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MatchPreviewDrawer from "./MatchPreviewDrawer";
import type { AppSettings, Match } from "@/lib/types";

afterEach(cleanup);

const settings: AppSettings = {
  prefix: "$",
  outputStyle: "line",
  viaCredits: true,
  selectedSlugs: ["eng.1"],
  pinnedTeamIds: [],
  displayTimezone: "cat",
  notifications: {
    enabled: false,
    competitionSlugs: [],
    teamIds: [],
    eventTypes: ["goal", "full-time", "aet", "penalties"],
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    pauseAll: false,
    digestEnabled: false,
    digestTime: "08:00",
  },
};

const match: Match = {
  id: "preview-match",
  competition: { slug: "eng.1", name: "Premier League", region: "England" },
  date: "2026-08-16T12:00:00Z",
  home: { name: "Arsenal", shortName: "ARS", score: 2 },
  away: { name: "Chelsea", shortName: "CHE", score: 1 },
  status: "finished",
  rawState: "post",
  statusDetail: "Full Time",
  shortDetail: "FT",
  kickoff: "12:00",
  goals: [{ id: "g1", minute: "7", scorer: "Rashford", side: "home", type: "goal" }],
  isOvertime: false,
};

describe("MatchPreviewDrawer", () => {
  it("renders match context and hands off to the dedicated route", () => {
    const onOpenRoute = vi.fn();
    render(<MatchPreviewDrawer match={match} settings={settings} onClose={vi.fn()} onOpenRoute={onOpenRoute} />);

    expect(screen.getByRole("dialog", { name: "Arsenal vs Chelsea" })).toBeTruthy();
    expect(screen.getByText("Premier League · England")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /View full match/i }));
    expect(onOpenRoute).toHaveBeenCalledWith("preview-match");
  });
});
