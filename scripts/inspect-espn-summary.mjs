const url = "https://site.api.espn.com/apis/site/v2/sports/soccer/caf.w.nations/summary?event=401909488";
const response = await fetch(url);
if (!response.ok) throw new Error(`ESPN summary request failed: ${response.status}`);
const data = await response.json();
const competition = data.header?.competitions?.[0] ?? {};

console.log(JSON.stringify({
  status: data.header?.competitions?.[0]?.status,
  competitors: competition.competitors?.map((entry) => ({
    homeAway: entry.homeAway,
    score: entry.score,
    shootoutScore: entry.shootoutScore,
    penaltyScore: entry.penaltyScore,
    team: entry.team?.displayName,
  })),
  keyEvents: (data.keyEvents ?? []).filter((event) => /goal|penalty/i.test(`${event.text ?? ""} ${event.type?.text ?? ""} ${event.type?.type ?? ""}`)).map((event) => ({
    id: event.id,
    text: event.text,
    shortText: event.shortText,
    type: event.type,
    clock: event.clock,
    period: event.period,
    team: event.team,
    participants: event.participants,
  })),
}, null, 2));
