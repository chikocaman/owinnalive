import { ArrowUpRight, Clipboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { goalIcon, outputLines, statusLabel } from "@/lib/match-utils";
import type { AppSettings, Match } from "@/lib/types";

interface MatchPreviewDrawerProps {
  match: Match | null;
  settings: AppSettings;
  onClose: () => void;
  onOpenRoute: (matchId: string) => void;
}

async function copyLine(value: string) {
  await navigator.clipboard.writeText(value);
}

export function MatchPreviewDrawer({ match, settings, onClose, onOpenRoute }: MatchPreviewDrawerProps) {
  if (!match) return null;
  const lines = outputLines(match, { prefix: settings.prefix, style: "line", viaCredits: settings.viaCredits });

  return (
    <div className="match-preview-layer" role="presentation">
      <button className="match-preview-layer__backdrop" type="button" aria-label="Close match preview" onClick={onClose} />
      <aside className="match-preview" role="dialog" aria-modal="true" aria-labelledby="match-preview-title">
        <header className="match-preview__header">
          <div><p className="eyebrow">Quick match preview</p><h2 id="match-preview-title">{match.home.name} vs {match.away.name}</h2></div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close match preview"><X size={18} /></button>
        </header>
        <div className="match-preview__scoreline"><span>{statusLabel(match)}</span><strong>{match.status === "upcoming" ? match.kickoff : `${match.home.score ?? 0} : ${match.away.score ?? 0}`}</strong><small>{match.competition.name} · {match.competition.region}</small></div>
        <div className="match-preview__body">
          {match.goals.length > 0 ? <ul className="goal-timeline">{match.goals.map((goal) => <li key={goal.id} className={`goal-timeline__item goal-timeline__item--${goal.side}`}><span>{goal.minute}</span><b>{goal.scorer}</b><em>{goalIcon(goal)}</em></li>)}</ul> : <p className="match-preview__empty">{match.status === "upcoming" ? "Kickoff has not started yet." : "No goal events recorded yet."}</p>}
          {lines.length > 0 && <div className="match-preview__copy"><p className="eyebrow">Copy-ready updates</p>{lines.slice(0, 4).map((line) => <div className="copy-line" key={line}><code>{line}</code><button type="button" onClick={() => void copyLine(line)} aria-label="Copy match update"><Clipboard size={14} /></button></div>)}</div>}
        </div>
        <footer className="match-preview__footer"><Button variant="outline" onClick={onClose}>Back to desk</Button><Button onClick={() => onOpenRoute(match.id)}><ArrowUpRight size={15} /> View full match</Button></footer>
      </aside>
    </div>
  );
}

export default MatchPreviewDrawer;

