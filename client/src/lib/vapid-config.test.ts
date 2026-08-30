import { describe, expect, it } from "vitest";
import webpush from "web-push";

describe("VAPID push configuration", () => {
  it("accepts the configured public/private keys and subject", () => {
    const publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
    const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
    const subject = process.env.VAPID_SUBJECT ?? "";

    expect(publicKey).toMatch(/^[A-Za-z0-9_-]{80,100}$/);
    expect(privateKey).toMatch(/^[A-Za-z0-9_-]{40,60}$/);
    expect(subject).toMatch(/^https?:\/\//);
    expect(() => webpush.setVapidDetails(subject, publicKey, privateKey)).not.toThrow();
  });
});
