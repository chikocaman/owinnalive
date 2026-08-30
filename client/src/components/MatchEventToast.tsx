import { Clipboard, Flag, Trophy } from "lucide-react";
import { toast } from "sonner";
import type { AppSettings, Goal, Match } from "@/lib/types";
import { outputLines } from "@/lib/match-utils";

export type MatchEventToastKind = "goal" | "full-time";

function copy(text: string, label: string) {
  void navigator.clipboard.writeText(text).then(() => toast.success("Copied", { description: "Ready to paste.", duration: 1400 })).catch(() => toast.error("Copy failed", { description: "Clipboard access was blocked." }));
}

function eventCopy(match: Match, settings: AppSettings, goal?: Goal): string[] {
  if (goal) return [outputLines({ ...match, goals: [goal] }, { prefix: settings.prefix, style: "line", viaCredits: settings.viaCredits })[0] || `${settings.prefix} ${goal.side} goal by "${goal.scorer}" at ${goal.minute}`];
  return outputLines(match, { prefix: settings.prefix, style: "line", viaCredits: settings.viaCredits });
}

export function MatchEventToast({ match, settings, kind, goal, toastId }: { match: Match; settings: AppSettings; kind: MatchEventToastKind; goal?: Goal; toastId: string | number }) {
  const lines = eventCopy(match, settings, goal);
  const end = lines.find((line) => /end match/.test(line));
  const penalties = lines.find((line) => /set penalties/.test(line));
  const copyGoal = goal ? lines[0] : undefined;
  return <div className="event-toast" role="status">
    <div className="event-toast__icon">{kind === "goal" ? <Flag size={16} /> : <Trophy size={16} />}</div>
    <div className="event-toast__body">
      <strong>{kind === "goal" ? `${goal?.scorer || "Goal"} · ${goal?.minute || ""}'` : `Full Time${match.isOvertime ? " (AET)" : ""}`}</strong>
      <span>{match.home.name} {match.home.score ?? 0}–{match.away.score ?? 0} · {match.competition.name}</span>
    </div>
    <div className="event-toast__actions">
      {copyGoal && <button type="button" onClick={() => copy(copyGoal, "Goal copied")} aria-label="Copy goal update"><Clipboard size={13} /></button>}
      {end && <button type="button" onClick={() => copy(end, "Full time copied")} aria-label={match.isOvertime ? "Copy AET update" : "Copy full time update"}><Clipboard size={13} /><small>{match.isOvertime ? "AET" : "FT"}</small></button>}
      {penalties && <button type="button" onClick={() => copy(penalties, "Penalty shootout copied")} aria-label="Copy penalty shootout update"><Clipboard size={13} /><small>P</small></button>}
      <button type="button" className="event-toast__dismiss" onClick={() => toast.dismiss(toastId)} aria-label="Dismiss notification">×</button>
    </div>
  </div>;
}
