import { describe, expect, it } from "vitest";
import { mergeScoreboardBatches } from "./espn";

describe("mergeScoreboardBatches", () => {
  it("retains fulfilled windows when another date window rejects", () => {
    const events = mergeScoreboardBatches([
      { status: "rejected", reason: new Error("previous day unavailable") },
      { status: "fulfilled", value: [{ id: "today-1", name: "Valid fixture" }] },
    ]);

    expect(events).toEqual([{ id: "today-1", name: "Valid fixture" }]);
  });

  it("deduplicates events that appear in both midnight windows", () => {
    const events = mergeScoreboardBatches([
      { status: "fulfilled", value: [{ id: "same", score: "1" }, { id: "previous" }] },
      { status: "fulfilled", value: [{ id: "same", score: "2" }, { id: "today" }] },
    ]);

    expect(events.map((event) => event.id)).toEqual(["same", "previous", "today"]);
    expect(events[0].score).toBe("2");
  });
});
