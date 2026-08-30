import { describe, expect, it } from "vitest";
import { parseMalawiGoalEvents, parseMalawiMatchRecords } from "./malawi";

describe("Malawi Super League source parser", () => {
  it("normalizes scheduled, live, and finished match records without inventing fixtures", () => {
    const feed = [
      "AA÷A1b2C3d4¬AD÷1780000000¬AB÷1¬CX÷Big Bullets¬AF÷Silver Strikers¬AG÷¬AH÷¬ER÷Round 1",
      "AA÷E5f6G7h8¬AD÷1780003600¬AB÷2¬CX÷Mighty Wanderers¬AF÷Kamuzu Barracks¬AG÷1¬AH÷0¬ER÷Round 1",
      "AA÷I9j0K1l2¬AD÷1779990000¬AB÷3¬CX÷Nyasa Big Bullets¬AF÷Karonga United¬AG÷2¬AH÷1¬ER÷Round 1",
    ].join("~");
    const matches = parseMalawiMatchRecords(feed);
    expect(matches).toHaveLength(3);
    expect(matches.map((match) => match.status)).toEqual(["scheduled", "live", "finished"]);
    expect(matches[0].homeScore).toBeNull();
    expect(matches[1].homeScore).toBe(1);
  });

  it("extracts scorer, side, minute, and penalty goal kind from event records", () => {
    const feed = [
      "III÷goal-1¬IA÷1¬IB÷37'¬IF÷John Banda¬IK÷Goal",
      "III÷goal-2¬IA÷2¬IB÷83'¬IF÷Lina Phiri¬IK÷Goal",
      "III÷goal-3¬IA÷1¬IB÷90'¬IF÷Peter Mbewe¬IK÷Penalty",
    ].join("~");
    expect(parseMalawiGoalEvents(feed)).toEqual([
      { id: "goal-1", team: "home", minute: "37", player: "John Banda", kind: "goal" },
      { id: "goal-2", team: "away", minute: "83", player: "Lina Phiri", kind: "goal" },
      { id: "goal-3", team: "home", minute: "90", player: "Peter Mbewe", kind: "penalty" },
    ]);
  });
});
