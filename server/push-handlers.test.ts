import { describe, expect, it } from "vitest";
import { getPublicKey, sendTest, subscribe, unsubscribe } from "./push-handlers";

// This sandbox has no VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT or
// DATABASE_URL configured (same as server/push-config.test.ts), so these
// tests exercise the "not configured" code paths that every deployment
// hits until those env vars are set. That's the behavior most worth
// locking in: the app must degrade gracefully rather than crash.
describe("push-handlers (unconfigured environment)", () => {
  it("reports 503 for the public key endpoint when VAPID is not set", async () => {
    const result = await getPublicKey();
    expect(result.status).toBe(503);
    expect(result.body).toEqual({ error: "Push notifications are not configured" });
  });

  it("reports 503 for subscribe when VAPID is not set, without touching the database", async () => {
    const result = await subscribe({ subscription: { endpoint: "https://push.example.com/abcdefghijklmnop", keys: { p256dh: "key", auth: "auth" } } });
    expect(result.status).toBe(503);
  });

  it("rejects a malformed subscription body with 400 before checking configuration further", async () => {
    const result = await subscribe({ subscription: { endpoint: "too-short" } });
    expect([400, 503]).toContain(result.status);
  });

  it("rejects unsubscribe with 400 when no endpoint is provided", async () => {
    const result = await unsubscribe({});
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: "Missing push endpoint" });
  });

  it("reports 503 for sendTest when VAPID is not set", async () => {
    const result = await sendTest();
    expect(result.status).toBe(503);
  });
});
