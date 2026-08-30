import { normalizeMatch } from "../client/src/lib/espn";
import { outputLines } from "../client/src/lib/match-utils";

const competition = { slug: "caf.w.nations", name: "Women's Africa Cup of Nations", region: "Africa / CAF" };

const raw = {
  id: "401909488",
  date: "2026-08-15T18:00:00Z",
  status: { type: { state: "post", name: "STATUS_FINAL_PEN", detail: "FT-Pens", shortDetail: "FT-Pens" } },
  competitions: [{
    competitors: [
      { homeAway: "home", score: "1", team: { id: "18221", displayName: "Morocco" } },
      { homeAway: "away", score: "1", team: { id: "21302", displayName: "Algeria" } },
    ],
  }],
};

const summary = {
  header: {
    competitions: [{
      status: { type: { detail: "FT-Pens", shortDetail: "FT-Pens" } },
      competitors: [
        { homeAway: "home", score: "1", shootoutScore: 2, team: { id: "18221", displayName: "Morocco" } },
        { homeAway: "away", score: "1", shootoutScore: 3, team: { id: "21302", displayName: "Algeria" } },
      ],
    }],
  },
  keyEvents: [
    { id: "1", text: "Kautar Azraf (Morocco) Goal at 37'", type: { text: "Goal", type: "goal" }, clock: { displayValue: "37'" }, period: { number: 1 }, team: { id: "18221" }, participants: [{ athlete: { displayName: "Kautar Azraf" } }] },
    { id: "2", text: "Lina Boussaha (Algeria) Goal at 83'", type: { text: "Goal", type: "goal" }, clock: { displayValue: "83'" }, period: { number: 2 }, team: { id: "21302" }, participants: [{ athlete: { displayName: "Lina Boussaha" } }] },
    { id: "3", text: "Nouhaila Benzina (Morocco) Penalty - Missed at 90'+7'", type: { text: "Penalty - Missed", type: "penalty---missed" }, clock: { displayValue: "90'+7'" }, period: { number: 2 }, team: { id: "18221" }, participants: [{ athlete: { displayName: "Nouhaila Benzina" } }] },
    { id: "4", text: "Chaymaa Mourtaji (Morocco) Penalty - Scored", type: { text: "Penalty - Scored", type: "penalty" }, clock: { displayValue: "120'" }, period: { number: 5 }, team: { id: "18221" }, participants: [{ athlete: { displayName: "Chaymaa Mourtaji" } }] },
  ],
};

const match = normalizeMatch(raw, competition, summary);
const expectedLines = [
  '$ home goal 1 by "Kautar Azraf" at 37',
  '$ away goal 1 by "Lina Boussaha" at 83',
  '$ end match',
  '$ set penalties 2-3',
];
const actualLines = outputLines(match, { prefix: "$", style: "line", viaCredits: true });

if (match.goals.length !== 2 || match.goals.some((goal) => goal.scorer === "Nouhaila Benzina" || goal.scorer === "Chaymaa Mourtaji")) {
  throw new Error(`Expected only the two non-shootout goals. Received: ${JSON.stringify(match.goals)}`);
}
if (match.penalties?.home !== 2 || match.penalties?.away !== 3) {
  throw new Error(`Expected 2-3 shootout score. Received: ${JSON.stringify(match.penalties)}`);
}
if (JSON.stringify(actualLines) !== JSON.stringify(expectedLines)) {
  throw new Error(`Expected ${JSON.stringify(expectedLines)}. Received: ${JSON.stringify(actualLines)}`);
}

console.log("Verified missed penalties and shootout kicks do not become normal goals; shootout score is retained.");
