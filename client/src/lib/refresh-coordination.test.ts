import { describe, expect, it } from "vitest";
import { canStartRefresh } from "./refresh-coordination";

describe("refresh coordination", () => {
  it("allows the first refresh", () => {
    expect(canStartRefresh(false)).toBe(true);
  });

  it("blocks a second refresh while the current score request is active", () => {
    expect(canStartRefresh(true)).toBe(false);
  });
});
