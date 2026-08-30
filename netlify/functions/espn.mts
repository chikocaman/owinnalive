import type { Config, Context } from "@netlify/functions";
import { ESPN_LIVE_CACHE_SECONDS, ESPN_STATIC_CACHE_SECONDS, isLiveEspnPath, proxyEspnRequest, UnsupportedEspnHostError } from "../../server/espn-proxy";

function errorResponse(status: number, error: string) {
  return new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const rawTarget = url.pathname.replace(/^\/api\/espn\//, "") + url.search;

  try {
    const result = await proxyEspnRequest(rawTarget);
    const live = isLiveEspnPath(url.pathname);
    const durableTtl = live ? ESPN_LIVE_CACHE_SECONDS : ESPN_STATIC_CACHE_SECONDS;
    return new Response(result.body, {
      status: result.status,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": result.cacheControl,
        // Netlify's durable/shared edge cache: this is what makes the
        // caching actually work in a serverless environment. Function
        // invocations are stateless (no shared process memory the way
        // server/index.ts's in-memory Map has on Render), so every
        // cold start and every edge node instead shares one cached
        // response here, keyed by URL. See server/espn-proxy.ts.
        "Netlify-CDN-Cache-Control": `public, s-maxage=${durableTtl}, stale-while-revalidate=${durableTtl * 4}, durable`,
        "X-FootyScores-Cache": result.cacheStatus,
      },
    });
  } catch (error) {
    if (error instanceof UnsupportedEspnHostError) return errorResponse(403, "Unsupported ESPN host");
    if (error instanceof TypeError) return errorResponse(400, "Invalid ESPN target");
    const message = error instanceof Error && error.name === "AbortError" ? "ESPN request timed out" : "ESPN request failed";
    return errorResponse(504, message);
  }
};

export const config: Config = {
  path: "/api/espn/*",
};
