/**
 * FootyScores Pro — Matchday Ledger component.
 * Fixture-slip card: status and score stay editorially calm; the copy slate is the working surface.
 */

import { useState } from "react";
import { Check, Clipboard, Clock3, Flag, MoreHorizontal, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { goalIcon, outputLines, statusLabel, statusName } from "@/lib/match-utils";
import type { AppSettings, Match, OutputStyle } from "@/lib/types";

interface MatchCardProps {
  match: Match;
  settings: AppSettings;
  highlighted?: boolean;
  onPreview?: (match: Match) => void;
}

function TeamLogo({ url, name }: { url?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (url && !failed) return <img className="team-logo" src={url} alt={`${name} crest`} onError={() => setFailed(true)} />;
  return <span className="team-fallback" aria-label={`${name} crest unavailable`}>{name.trim().slice(0, 2).toUpperCase()}</span>;
}

function Score({ value, isUpcoming }: { value: number | null; isUpcoming: boolean }) {
  return <span className={cn("score-value", isUpcoming && "score-value--upcoming")}>{isUpcoming ? "—" : value ?? "—"}</span>;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function MatchCard({ match, settings, highlighted = false, onPreview }: MatchCardProps) {
  const [style, setStyle] = useState<OutputStyle>(settings.outputStyle);
  const [showTimeline, setShowTimeline] = useState(false);
  const [copiedLine, setCopiedLine] = useState<string | null>(null);
  const lines = outputLines(match, { prefix: settings.prefix, style, viaCredits: settings.viaCredits });
  const isUpcoming = match.status === "upcoming";
  const hasCopyLines = lines.length > 0;
  const status = statusName(match);

  const handleCopy = async (line: string) => {
    const success = await copyText(line);
    if (success) {
      setCopiedLine(line);
      setTimeout(() => setCopiedLine(null), 2000);
    }
  };

  return (
    <article id={`match-${match.id}`} data-match-id={match.id} className={cn("match-card", `match-card--${match.status}`, highlighted && "match-card--highlighted")} aria-current={highlighted ? "true" : undefined}>
      <div className="match-card__topline">
        <span className={cn("status-badge", `status-badge--${match.status}`)}>
          {match.status === "live" && <span className="live-dot" />}
          {statusLabel(match)}
        </span>
        <span className="match-card__meta">{status}</span>
          <div className="match-card__actions">
            {onPreview && <button type="button" className="card-preview-action" onClick={() => onPreview(match)}>Preview</button>}
            <button type="button" className="card-icon-action" onClick={() => setShowTimeline((value) => !value)} aria-label="Toggle match details" aria-expanded={showTimeline}>
              <MoreHorizontal size={17} />
            </button>
          </div>
      </div>

      <div className="fixture-row">
        <div className="fixture-team fixture-team--home">
          <span className="fixture-team__name">{match.home.name}</span>
          <TeamLogo url={match.home.logo} name={match.home.name} />
        </div>
        <div className="score-stack" aria-label={`${match.home.name} ${match.home.score ?? 0}, ${match.away.name} ${match.away.score ?? 0}`}>
          <div className="score-line">
            <Score value={match.home.score} isUpcoming={isUpcoming} />
            <span className="score-divider">:</span>
            <Score value={match.away.score} isUpcoming={isUpcoming} />
          </div>
          {match.status === "live" && <span className="live-score-indicator" role="status" aria-label="Live match"><span className="live-score-indicator__dot" aria-hidden="true" />LIVE</span>}
          {isUpcoming ? <span className="kickoff-line"><Clock3 size={12} /> {match.kickoff} CAT</span> : match.penalties ? <span className="penalty-line">Pens {match.penalties.home}–{match.penalties.away}</span> : null}
        </div>
        <div className="fixture-team fixture-team--away">
          <TeamLogo url={match.away.logo} name={match.away.name} />
          <span className="fixture-team__name">{match.away.name}</span>
        </div>
      </div>

      {showTimeline && (
        <div className="match-detail">
          {match.venue && <p><Flag size={14} /> {match.venue}</p>}
          {match.goals.length > 0 ? (
            <ul className="goal-timeline">
              {match.goals.map((goal) => <li key={goal.id} className={`goal-timeline__item goal-timeline__item--${goal.side}`}><span>{goal.minute}</span><b>{goal.scorer}</b><em>{goalIcon(goal)}</em></li>)}
            </ul>
          ) : <p><Trophy size={14} /> {isUpcoming ? "Kickoff has not started yet." : "No goal events recorded yet."}</p>}
          {match.provenance && <p className="diagnostic-line"><span className="diagnostic-dot" /> Score: {match.provenance.scoreboard} · Events: {match.provenance.summary} · Competition: {match.provenance.competition} · Artwork: {match.provenance.logo}</p>}
        </div>
      )}

      <div className="copy-slate">
        <div className="copy-slate__head">
          <span>Match update</span>
          <div className="copy-slate__controls">
            <button type="button" className={cn("style-toggle", style === "line" && "style-toggle--active")} onClick={() => setStyle("line")} aria-pressed={style === "line"}>Lines</button>
            <button type="button" className={cn("style-toggle", style === "combined" && "style-toggle--active")} onClick={() => setStyle("combined")} aria-pressed={style === "combined"}>Combined</button>
          </div>
        </div>
        <div className="copy-slate__lines">
          {hasCopyLines ? lines.map((line) => (
            <div key={line} className="copy-line">
              <code>{line}</code>
              <button type="button" onClick={() => void handleCopy(line)} aria-label="Copy this update line">{copiedLine === line ? <Check size={14} /> : <Clipboard size={14} />}</button>
            </div>
          )) : (
            <div className="copy-line copy-line--notice"><code>{match.status === "canceled" ? "No approved copy format for a canceled fixture." : "No goal details available."}</code></div>
          )}
        </div>
      </div>
    </article>
  );
}

export function MatchCardSkeleton() {
  return <div className="match-card match-card--skeleton" aria-hidden="true"><div className="skeleton-line skeleton-line--short" /><div className="skeleton-score" /><div className="skeleton-slate" /></div>;
}
