import { describe, expect, it } from "vitest";
import { normalizeMatch } from "./espn";

const competition = {
  slug: "esp.1",
  name: "LaLiga",
  region: "Spain",
  logo: "https://a.espncdn.com/i/leaguelogos/soccer/500/15.png",
};

describe("scoreboard score preservation", () => {
  it("normalizes ESPN string scores instead of treating them as missing", () => {
    const match = normalizeMatch({
      id: "fixture-1",
      date: "2026-08-16T18:00:00Z",
      status: { type: { state: "in", name: "In Progress", detail: "45'" } },
      competitions: [{
        competitors: [
          { homeAway: "home", score: "2", team: { id: "home", displayName: "Home FC" } },
          { homeAway: "away", score: "1", team: { id: "away", displayName: "Away FC" } },
        ],
      }],
    }, competition);

    expect(match.home.score).toBe(2);
    expect(match.away.score).toBe(1);
    expect(match.status).toBe("live");
  });
});
