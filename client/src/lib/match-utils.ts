/**
 * FootyScores Pro — Matchday Ledger presentation utilities.
 * The output generator preserves the original app's copy-ready syntax exactly.
 */

import type { Goal, Match, OutputStyle } from "./types";

export function statusLabel(match: Match) {
  if (match.status === "live") return match.clock || match.shortDetail || "LIVE";
  if (match.status === "upcoming") return match.kickoff;
  if (match.status === "finished") return match.penalties ? "FT · Pens" : "FT";
  if (match.status === "postponed") return "Postponed";
  return "Canceled";
}

export function statusName(match: Match) {
  if (match.status === "live") return "Live";
  if (match.status === "upcoming") return "Upcoming";
  if (match.status === "finished") return "Full time";
  if (match.status === "postponed") return "Postponed";
  return "Canceled";
}

function quote(name: string) {
  return `"${name.replace(/["“”]/g, "").trim()}"`;
}

function minuteValue(minute: string) {
  const match = minute.match(/^(\d+)(?:\+(\d+))?$/);
  if (!match) return Number.POSITIVE_INFINITY;
  return Number(match[1]) * 1000 + Number(match[2] || 0);
}

function isRenderableGoal(goal: Goal) {
  return goal.scorer.trim().toLowerCase() !== "unknown" && /^\d+(?:\+\d+)?$/.test(goal.minute);
}

function formattedGoals(match: Match, viaCredits: boolean) {
  const counts = { home: 0, away: 0 };
  return match.goals
    .filter(isRenderableGoal)
    .map((goal, sourceIndex) => ({ goal, sourceIndex }))
    .sort((a, b) => minuteValue(a.goal.minute) - minuteValue(b.goal.minute) || a.sourceIndex - b.sourceIndex)
    .map(({ goal }) => {
      counts[goal.side] += 1;
      const via = viaCredits && goal.type === "penalty" ? " via P" : viaCredits && goal.type === "own-goal" ? " via OG" : "";
      return { ...goal, ordinal: counts[goal.side], via };
    });
}

function goalClause(goal: ReturnType<typeof formattedGoals>[number], includeSide: boolean) {
  const head = includeSide ? `${goal.side} goal ${goal.ordinal}` : `${goal.ordinal}`;
  return `${head} by ${quote(goal.scorer)} at ${goal.minute}${goal.via}`;
}

function endLines(match: Match, prefix: string) {
  if (match.status !== "finished") return [];
  const end = `${prefix} end match${match.isOvertime ? " AET" : ""}`;
  const pens = match.penalties ? `${prefix} set penalties ${match.penalties.home}-${match.penalties.away}` : null;
  return pens ? [end, pens] : [end];
}

export function outputLines(match: Match, options: { prefix: string; style: OutputStyle; viaCredits: boolean }) {
  const prefix = options.prefix.trim() || "$";
  if (match.status === "upcoming") return [`${prefix} match at ${match.kickoff}`];
  if (match.status === "postponed") return [`${prefix} match postponed`];
  if (match.status === "canceled") return [];

  const goals = formattedGoals(match, options.viaCredits);
  const terminal = endLines(match, prefix);

  if (options.style === "line") {
    return [...goals.map((goal) => `${prefix} ${goalClause(goal, true)}`), ...terminal];
  }

  const grouped = (["home", "away"] as const)
    .map((side) => goals.filter((goal) => goal.side === side))
    .filter((sideGoals) => sideGoals.length > 0)
    .map((sideGoals) => `${goalClause(sideGoals[0], true)}${sideGoals.slice(1).map((goal) => `, ${goalClause(goal, false)}`).join("")}`);
  const combined = [...grouped, ...terminal.map((line) => line.replace(`${prefix} `, ""))];
  return combined.length ? [`${prefix} ${combined.join("; ")}`] : [];
}

export function goalIcon(goal: Goal) {
  if (goal.type === "penalty") return "P";
  if (goal.type === "own-goal") return "OG";
  return "G";
}

export function matchSearchText(match: Match) {
  return [
    match.home.name,
    match.away.name,
    match.competition.name,
    ...match.goals.map((goal) => goal.scorer),
  ]
    .join(" ")
    .toLocaleLowerCase();
}
