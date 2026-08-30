import fs from "node:fs/promises";

const indexUrl = "https://sports.core.api.espn.com/v2/sports/soccer/leagues?limit=500";
const regionRules = [
  [/^eng\./, "England"], [/^esp\./, "Spain"], [/^ger\./, "Germany"], [/^ita\./, "Italy"], [/^fra\./, "France"],
  [/^ned\./, "Netherlands"], [/^por\./, "Portugal"], [/^bel\./, "Belgium"], [/^sco\./, "Scotland"], [/^irl\./, "Ireland"],
  [/^usa\.|^ncaaf\./, "United States"], [/^mex\./, "Mexico"], [/^bra\./, "Brazil"], [/^arg\./, "Argentina"], [/^col\./, "Colombia"],
  [/^chi\./, "Chile"], [/^uru\./, "Uruguay"], [/^jpn\./, "Japan"], [/^chn\./, "China"], [/^kor\./, "South Korea"],
  [/^aus\./, "Australia"], [/^ksa\./, "Saudi Arabia"], [/^uefa\./, "UEFA"], [/^caf\./, "Africa / CAF"],
  [/^concacaf\./, "CONCACAF"], [/^conmebol\./, "CONMEBOL"], [/^fifa\./, "International / FIFA"],
];
const regionFor = (slug) => regionRules.find(([pattern]) => pattern.test(slug))?.[1] || "International";
async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`ESPN request failed: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

const { items = [] } = await fetchJson(indexUrl);
const output = [];
let cursor = 0;
const workers = Array.from({ length: 12 }, async () => {
  while (cursor < items.length) {
    const item = items[cursor++];
    const ref = item.$ref || "";
    const slug = decodeURIComponent(ref).match(/leagues\/([^?/#]+)/)?.[1] || item.slug || item.id;
    if (!slug) continue;
    try {
      const raw = await fetchJson(`https://sports.core.api.espn.com/v2/sports/soccer/leagues/${encodeURIComponent(slug)}?lang=en&region=us`);
      const alternateId = String(raw.alternateId || raw.uid?.split(":").at(-1) || "").trim() || undefined;
      let logo = raw.logos?.[0]?.href || raw.logo?.href || raw.logo;
      if (!logo) {
        try {
          const scoreboard = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${encodeURIComponent(slug)}/scoreboard?limit=1`, 8000);
          logo = scoreboard.leagues?.[0]?.logos?.[0]?.href;
        } catch {
          // The durable numeric resolver remains available at runtime when ESPN exposes a valid CDN asset.
        }
      }
      const usableLogo = typeof logo === "string" && /^https?:\/\//i.test(logo) && !/default-team-logo|\/teamlogos\/soccer\//i.test(logo) ? logo : undefined;
      output.push({ slug, name: String(raw.displayName || raw.name || raw.shortName || slug).trim(), region: regionFor(slug), alternateId, logo: usableLogo });
    } catch {
      // Keep the fallback durable even if an individual league detail is unavailable.
    }
  }
});
await Promise.all(workers);
output.sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));
const body = `import type { Competition } from "./types";\n\n/** Generated from ESPN Core API; runtime uses it when the directory endpoint is unavailable. */\nexport const FALLBACK_COMPETITIONS: Competition[] = ${JSON.stringify(output, null, 2)};\n`;
await fs.writeFile("client/src/lib/fallback-competitions.ts", body);
console.log(`Generated ${output.length} competition records.`);
