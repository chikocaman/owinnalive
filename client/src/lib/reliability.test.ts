import { describe, expect, it } from "vitest";
import { FALLBACK_COMPETITIONS } from "./fallback-competitions";
import { SCORE_REFRESH_INTERVAL_MS } from "./constants";
import { logoFromPayload, logoUrl, offsetDateKey, resolveCompetitionLogo } from "./espn";
import { parsePersistedView } from "./view-state";
import { curatedEspnCompetitionLogo, officialCompetitionLogo } from "./official-competition-logos";
import { competitionMarkPresentation } from "../components/CompetitionMark";

describe("reliability helpers", () => {
  it("restores a valid persisted filter and rejects malformed values", () => {
    expect(parsePersistedView(JSON.stringify({ dateKey: "20260816", filter: "upcoming" }))).toEqual({ dateKey: "20260816", filter: "upcoming" });
    expect(parsePersistedView(JSON.stringify({ filter: "not-a-filter" })).filter).toBe("all");
    expect(parsePersistedView("broken-json").filter).toBe("all");
  });

  it("handles the CAT previous-date boundary and keeps a broad browse fallback", () => {
    expect(offsetDateKey("20260101", -1)).toBe("20251231");
    expect(offsetDateKey("20251231", 1)).toBe("20260101");
    expect(FALLBACK_COMPETITIONS.length).toBeGreaterThanOrEqual(171);
    expect(FALLBACK_COMPETITIONS.filter((competition) => competition.alternateId).length).toBeGreaterThan(150);
    expect(FALLBACK_COMPETITIONS.filter((competition) => competition.logo).length).toBeGreaterThan(100);
    expect(FALLBACK_COMPETITIONS.some((competition) => /default-team-logo|\/teamlogos\/soccer\//i.test(competition.logo || ""))).toBe(false);
    expect(logoUrl("2557")).toBe("https://a.espncdn.com/i/leaguelogos/soccer/500/2557.png");
    expect(logoFromPayload({ competitions: [{ logos: [{ href: "https://a.espncdn.com/i/leaguelogos/soccer/500/23.png" }] }] })).toBe("https://a.espncdn.com/i/leaguelogos/soccer/500/23.png");
    expect(logoFromPayload({ leagues: [{ logos: [{ href: "https://a.espncdn.com/i/leaguelogos/soccer/500/76.png" }] }] })).toBe("https://a.espncdn.com/i/leaguelogos/soccer/500/76.png");
    expect(logoUrl()).toBeUndefined();
    const curated = {
      "eng.1": "23", "esp.1": "15", "ger.1": "10", "ita.1": "12", "fra.1": "9",
      "uefa.champions": "2", "uefa.europa": "2310", "uefa.europa.conf": "2579",
      "fifa.world": "4", "usa.1": "19", "ksa.1": "2178", "caf.champions": "1979",
    };
    for (const [slug, id] of Object.entries(curated)) {
      expect(curatedEspnCompetitionLogo(slug)).toBe(`https://a.espncdn.com/i/leaguelogos/soccer/500/${id}.png`);
    }
    const directLogo = "https://example.test/authoritative-premier.png";
    expect(logoFromPayload({ slug: "eng.1", competitions: [{ logos: [{ href: directLogo }] }] })).toBe(directLogo);
    expect(resolveCompetitionLogo({ slug: "eng.1", name: "Premier League", region: "England", logo: directLogo })).toMatchObject({ logo: directLogo });
    expect(officialCompetitionLogo("esp.w.1")).toContain("Ligafwomen.svg");
    expect(officialCompetitionLogo("unknown.competition")).toBeUndefined();
    const competition = { slug: "caf.w.nations", name: "Women's Africa Cup of Nations", region: "Africa / CAF", logo: "https://example.test/logo.png" };
    expect(competitionMarkPresentation(competition).showImage).toBe(true);
    expect(competitionMarkPresentation(competition, true)).toMatchObject({ showImage: false, initials: "WA" });
    expect(competitionMarkPresentation({ ...competition, logo: undefined }).showImage).toBe(false);
    expect(SCORE_REFRESH_INTERVAL_MS).toBe(15_000);
  });
});
