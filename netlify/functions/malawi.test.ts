import { afterEach, describe, expect, it, vi } from "vitest";
import malawiFunction, { config } from "./malawi.mts";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("netlify malawi function", () => {
  it("is configured for both the scoreboard and events paths", () => {
    expect(config.path).toEqual(["/api/malawi/scoreboard", "/api/malawi/events/*"]);
  });

  it("serves the scoreboard with a durable cache header", async () => {
    global.fetch = vi.fn(async () => new Response("", { status: 200 })) as unknown as typeof fetch;
    const req = new Request("https://footyscores.example/api/malawi/scoreboard");
    const res = await malawiFunction(req, {} as never);
    expect(res.status).toBe(200);
    expect(res.headers.get("Netlify-CDN-Cache-Control")).toMatch(/durable/);
    const payload = await res.json();
    expect(payload.source).toBe("flashscore-malawi-super-league");
  });

  it("rejects a malformed match id with 400 instead of hitting the network", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    const req = new Request("https://footyscores.example/api/malawi/events/short");
    const res = await malawiFunction(req, {} as never);
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 404 for unrelated paths", async () => {
    const req = new Request("https://footyscores.example/api/malawi/unknown");
    const res = await malawiFunction(req, {} as never);
    expect(res.status).toBe(404);
  });
});
