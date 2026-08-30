import { describe, expect, it } from "vitest";
import pushFunction, { config } from "./push.mts";

describe("netlify push function", () => {
  it("is configured for all three push paths", () => {
    expect(config.path).toEqual(["/api/push/public-key", "/api/push/subscribe", "/api/push/test"]);
  });

  it("routes GET /api/push/public-key to the public-key handler", async () => {
    const req = new Request("https://footyscores.example/api/push/public-key", { method: "GET" });
    const res = await pushFunction(req, {} as never);
    // Unconfigured in this test environment (no VAPID_* env vars), same as
    // server/push-handlers.test.ts — the important thing is it's routed
    // to the right handler and degrades to 503, not a 404.
    expect(res.status).toBe(503);
  });

  it("routes POST /api/push/subscribe with a JSON body to the subscribe handler", async () => {
    const req = new Request("https://footyscores.example/api/push/subscribe", { method: "POST", body: JSON.stringify({}) });
    const res = await pushFunction(req, {} as never);
    expect(res.status).toBe(503);
  });

  it("returns 404 for an unrecognized method/path combination", async () => {
    const req = new Request("https://footyscores.example/api/push/subscribe", { method: "GET" });
    const res = await pushFunction(req, {} as never);
    expect(res.status).toBe(404);
  });
});
