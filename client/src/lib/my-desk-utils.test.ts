import { describe, expect, it } from "vitest";
import { selectMyDeskMatches, toggleNotificationCompetition } from "@/lib/my-desk-utils";
import type { Match } from "@/lib/types";

const match = (id: string, home: string, away: string, competition: string) => ({ id, home: { id: home, name: home }, away: { id: away, name: away }, competition: { slug: competition, name: competition, region: "Test" } } as Match);

describe("my desk utilities", () => {
  it("selects matches for pinned teams or selected competitions without duplicates", () => {
    const matches = [match("1", "ars", "che", "eng.1"), match("2", "bar", "atm", "esp.1"), match("3", "mci", "liv", "eng.1")];
    expect(selectMyDeskMatches(matches, ["bar"], ["eng.1"]).map((item) => item.id)).toEqual(["1", "2", "3"]);
  });

  it("toggles notification competition targets predictably", () => {
    expect(toggleNotificationCompetition([], "eng.1")).toEqual(["eng.1"]);
    expect(toggleNotificationCompetition(["eng.1", "esp.1"], "eng.1")).toEqual(["esp.1"]);
  });
});
