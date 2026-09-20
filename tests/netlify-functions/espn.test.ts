import { afterEach, describe, expect, it, vi } from "vitest";
import espnFunction, { config } from "../../netlify/functions/espn.mts";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
}

describe("netlify espn function", () => {
  it("is configured to handle every /api/espn/* path", () => {
    expect(config.path).toBe("/api/espn/*");
  });

  it("proxies a scoreboard request and marks it durable-cacheable at the live TTL", async () => {
    mockFetchOnce(200, { events: [] });
    const req = new Request("https://footyscores.example/api/espn/site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=20260829&liveRefresh=1");
    const res = await espnFunction(req, {} as never);
    expect(res.status).toBe(200);
    expect(res.headers.get("Netlify-CDN-Cache-Control")).toMatch(/durable/);
    expect(res.headers.get("Netlify-CDN-Cache-Control")).toMatch(/s-maxage=8/);
    expect(await res.json()).toEqual({ events: [] });
  });

  it("rejects hosts outside the ESPN allowlist with 403", async () => {
    const req = new Request("https://footyscores.example/api/espn/evil.example.com/steal-data");
    const res = await espnFunction(req, {} as never);
    expect(res.status).toBe(403);
  });
});