import type { Config, Context } from "@netlify/functions";
import { loadMalawiEvents, loadMalawiScoreboard, MALAWI_EVENTS_CACHE_SECONDS, MALAWI_SCOREBOARD_CACHE_SECONDS } from "../../server/malawi";

function json(body: unknown, status: number, durableTtlSeconds?: number) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (status === 200 && durableTtlSeconds) {
    // Browser always revalidates; Netlify's shared edge cache does the
    // actual short-lived caching so repeated polls (and other visitors)
    // reuse one Flashscore fetch instead of each re-scraping it.
    headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
    headers["Netlify-CDN-Cache-Control"] = `public, s-maxage=${durableTtlSeconds}, stale-while-revalidate=${durableTtlSeconds * 4}, durable`;
  } else {
    headers["Cache-Control"] = "no-store";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/malawi/scoreboard") {
    try {
      const matches = await loadMalawiScoreboard();
      return json({ source: "flashscore-malawi-super-league", fetchedAt: Date.now(), matches }, 200, MALAWI_SCOREBOARD_CACHE_SECONDS);
    } catch (error) {
      console.error("[malawi] scoreboard failed", error);
      return json({ error: "Malawi Super League source is temporarily unavailable" }, 502);
    }
  }

  if (url.pathname.startsWith("/api/malawi/events/")) {
    const matchId = url.pathname.slice("/api/malawi/events/".length);
    if (!/^[A-Za-z0-9]{8}$/.test(matchId)) return json({ error: "Invalid Malawi match id" }, 400);
    try {
      const events = await loadMalawiEvents(matchId);
      return json({ source: "flashscore-malawi-super-league", fetchedAt: Date.now(), events }, 200, MALAWI_EVENTS_CACHE_SECONDS);
    } catch (error) {
      console.error("[malawi] events failed", error);
      return json({ error: "Malawi goal events are temporarily unavailable" }, 502);
    }
  }

  return json({ error: "Not found" }, 404);
};

export const config: Config = {
  path: ["/api/malawi/scoreboard", "/api/malawi/events/*"],
};
