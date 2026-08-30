/** ESPN's stable curated league IDs for the main competitions. */
export const CURATED_ESPN_LOGO_IDS: Record<string, string> = {
  "eng.1": "23",
  "esp.1": "15",
  "ger.1": "10",
  "ita.1": "12",
  "fra.1": "9",
  "uefa.champions": "2",
  "uefa.europa": "2310",
  "uefa.europa.conf": "2579",
  "fifa.world": "4",
  "usa.1": "19",
  "ksa.1": "2178",
  "caf.champions": "1979",
};

export function curatedEspnCompetitionLogo(slug?: string) {
  const id = slug ? CURATED_ESPN_LOGO_IDS[slug] : undefined;
  return id ? `https://a.espncdn.com/i/leaguelogos/soccer/500/${id}.png` : undefined;
}

/** Exact official competition artwork used only when ESPN does not publish a league logo. */
export const OFFICIAL_COMPETITION_LOGOS: Record<string, string> = {
  "can.w.nsl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Northern_Super_League.svg/250px-Northern_Super_League.svg.png",
  "concacaf.w.gold": "https://upload.wikimedia.org/wikipedia/commons/8/87/CONCACAF_W_Gold_Cup_logo.png",
  "conmebol.america.femenina": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Copa-America-Femenina-Logo.png",
  "esp.w.1": "https://upload.wikimedia.org/wikipedia/en/thumb/b/b3/Ligafwomen.svg/1280px-Ligafwomen.svg.png",
  "fra.w.1": "https://upload.wikimedia.org/wikipedia/en/3/33/Ligue_Butagaz_Energie_2019_logo.png",
};

export function officialCompetitionLogo(slug?: string) {
  return slug ? OFFICIAL_COMPETITION_LOGOS[slug] : undefined;
}
