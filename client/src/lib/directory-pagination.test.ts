// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDirectory } from "./espn";
import { MALAWI_SLUG } from "./malawi";

const originalFetch = global.fetch;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
  localStorage.clear();
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

describe("getDirectory pagination", () => {
  it("walks every page of ESPN's leagues list instead of stopping after page 1", async () => {
    // Simulate a 3-page leagues collection (this is exactly the shape that was
    // previously silently truncated to page 1 — some competitions on pages 2
    // and 3 would never show up in search no matter what you typed).
    const pages: Record<number, { items: Array<{ slug: string }>; pageCount: number }> = {
      1: { items: [{ slug: "eng.1" }], pageCount: 3 },
      2: { items: [{ slug: "esp.1" }], pageCount: 3 },
      3: { items: [{ slug: "late.league" }], pageCount: 3 },
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/leagues?")) {
        const pageMatch = url.match(/page=(\d+)/);
        const page = pageMatch ? Number(pageMatch[1]) : 1;
        return jsonResponse(pages[page]);
      }
      // League detail lookups: echo back a minimal competition for whichever slug was requested.
      const slugMatch = url.match(/leagues\/([^/?]+)\?/);
      const slug = slugMatch ? decodeURIComponent(slugMatch[1]) : "unknown";
      return jsonResponse({ slug, displayName: slug });
    }) as unknown as typeof fetch;

    const directory = await getDirectory({ force: true });
    const slugs = directory.map((competition) => competition.slug);

    expect(slugs).toContain("eng.1");
    expect(slugs).toContain("esp.1");
    // The whole point of the fix: a league that only exists on a later page
    // must still show up, not just whatever page 1 happened to contain.
    expect(slugs).toContain("late.league");
  });

  it("includes Malawi Super League on a fresh (non-cached) directory fetch", async () => {
    // Malawi Super League isn't part of ESPN's own leagues list — it's
    // scraped separately and appended client-side. This previously only
    // happened on the cached/fallback paths, so a fresh successful fetch
    // straight from ESPN would silently omit it from the browsable list.
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/leagues?")) return jsonResponse({ items: [{ slug: "eng.1" }], pageCount: 1 });
      return jsonResponse({ slug: "eng.1", displayName: "Premier League" });
    }) as unknown as typeof fetch;

    const directory = await getDirectory({ force: true });
    expect(directory.map((competition) => competition.slug)).toContain(MALAWI_SLUG);
  });
});
