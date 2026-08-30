import type { Match } from "./types";

export type MatchNotification = { kind: "goal"; goalId: string } | { kind: "full-time" };

export function getMatchNotifications(previous: Match | undefined, current: Match): MatchNotification[] {
  if (!previous) return [];
  const notifications: MatchNotification[] = [];
  const newGoal = current.goals.find((goal) => !previous.goals.some((item) => item.id === goal.id));
  if (newGoal) notifications.push({ kind: "goal", goalId: newGoal.id });
  if (previous.status !== "finished" && current.status === "finished") notifications.push({ kind: "full-time" });
  return notifications;
}
