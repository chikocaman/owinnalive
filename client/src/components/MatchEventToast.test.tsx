// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MatchEventToast } from "./MatchEventToast";
import type { AppSettings, Match } from "@/lib/types";

afterEach(cleanup);

const settings: AppSettings = { prefix: "$", outputStyle: "line", viaCredits: true, selectedSlugs: ["eng.1"], pinnedTeamIds: [], displayTimezone: "cat", notifications: { enabled: false, competitionSlugs: [], teamIds: [], eventTypes: ["goal", "full-time", "aet", "penalties"], quietHoursEnabled: false, quietHoursStart: "22:00", quietHoursEnd: "07:00", pauseAll: false, digestEnabled: false, digestTime: "08:00" } };
const baseMatch: Match = {
  id: "toast-match",
  competition: { slug: "eng.1", name: "Premier League", region: "England" },
  date: "2026-08-16T12:00:00Z",
  home: { name: "Arsenal", shortName: "ARS", score: 1 },
  away: { name: "Chelsea", shortName: "CHE", score: 1 },
  status: "finished",
  rawState: "post",
  statusDetail: "Full Time",
  shortDetail: "FT",
  kickoff: "12:00",
  goals: [],
  isOvertime: false,
};

function installClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  return writeText;
}

describe("MatchEventToast clipboard actions", () => {
  it("copies only a goal update from the goal action", async () => {
    const writeText = installClipboard();
    render(<MatchEventToast match={{ ...baseMatch, status: "live", goals: [{ id: "g1", minute: "7", scorer: "Rashford", side: "home", type: "goal" }] }} settings={settings} kind="goal" goal={{ id: "g1", minute: "7", scorer: "Rashford", side: "home", type: "goal" }} toastId="t1" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy goal update" }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('$ home goal 1 by "Rashford" at 7'));
  });

  it("copies the plain full-time line for a non-overtime match", async () => {
    const writeText = installClipboard();
    render(<MatchEventToast match={baseMatch} settings={settings} kind="full-time" toastId="t-full-time" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy full time update" }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("$ end match"));
  });

  it("exposes full-time, AET, and penalty copy actions", async () => {
    const writeText = installClipboard();
    render(<MatchEventToast match={{ ...baseMatch, isOvertime: true, penalties: { home: 4, away: 3 } }} settings={settings} kind="full-time" toastId="t2" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy AET update" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy penalty shootout update" }));
    await vi.waitFor(() => expect(writeText).toHaveBeenNthCalledWith(1, "$ end match AET"));
    await vi.waitFor(() => expect(writeText).toHaveBeenNthCalledWith(2, "$ set penalties 4-3"));
  });
});
