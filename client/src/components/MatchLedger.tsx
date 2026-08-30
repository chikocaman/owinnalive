/**
 * FootyScores Pro — Matchday Ledger component.
 * The grouped competition ledger keeps empty matchdays honest and live data highly scannable.
 */

import { useEffect, useMemo, useState } from "react";
import { Radio, RefreshCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MatchCard, MatchCardSkeleton } from "@/components/MatchCard";
import { CompetitionMark } from "@/components/CompetitionMark";
import { DEFAULT_MATCH_FILTERS, type AppSettings, type FilterKey, type Match, type MatchFilterState } from "@/lib/types";
import { filterMatches } from "@/lib/filter-utils";

interface MatchLedgerProps {
  matches: Match[];
  settings: AppSettings;
  filter: FilterKey;
  query: string;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClearFilters: () => void;
  onResetMatchday: () => void;
  highlightMatchId?: string | null;
  highlightCompetitionSlug?: string | null;
  filters?: MatchFilterState;
  onPreview?: (match: Match) => void;
}

export function filterVisibleMatches(matches: Match[], filter: FilterKey, query: string, filters: MatchFilterState = DEFAULT_MATCH_FILTERS) {
  return filterMatches(matches, filter, query, filters);
}

export function MatchLedger({ matches, settings, filter, query, isLoading, error, onRefresh, onClearFilters, onResetMatchday, highlightMatchId = null, highlightCompetitionSlug = null, filters = DEFAULT_MATCH_FILTERS, onPreview }: MatchLedgerProps) {
  const [loadingExpired, setLoadingExpired] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setLoadingExpired(false);
      return;
    }
    const timeout = window.setTimeout(() => setLoadingExpired(true), 10_000);
    return () => window.clearTimeout(timeout);
  }, [isLoading]);
  const visible = useMemo(() => filterVisibleMatches(matches, filter, query, filters), [matches, filter, query, filters]);
  const hasQuery = query.trim().length > 0;
  const groups = useMemo(() => visible.reduce<Record<string, Match[]>>((accumulator, match) => {
    (accumulator[match.competition.slug] ||= []).push(match);
    return accumulator;
  }, {}), [visible]);

  if (isLoading && !loadingExpired) {
    return <div className="ledger"><div className="ledger-loading-label"><RefreshCw size={15} className="spin" /> Loading the matchdesk</div><section className="competition-section"><div className="competition-section__head skeleton-heading" /> <div className="match-grid">{Array.from({ length: 4 }, (_, index) => <MatchCardSkeleton key={index} />)}</div></section></div>;
  }

  if (!visible.length) {
    return (
      <div className="ledger-empty">
        <div className="ledger-empty__mark">{hasQuery ? <SearchX size={28} /> : <Radio size={28} />}</div>
        <p className="eyebrow">{error ? "Data note" : "Clear fixture list"}</p>
        <h3>{error || (hasQuery ? `No matches match “${query}”` : "No matches for these filters")}</h3>
        <p>{error ? "The app never fabricates fixtures. Refresh when ESPN is available again, or switch the matchday." : hasQuery ? "Try a different team, player, or competition." : matches.length > 0 ? "Try clearing the active status filter or choose another matchday." : "Try another matchday or add a competition to your desk."}</p>
        <div className="ledger-empty__actions">
          {!error && !hasQuery && (filter !== "all" || matches.length > 0) && <Button variant="outline" onClick={onClearFilters}>Clear filter</Button>}
          {!error && !hasQuery && <Button variant="outline" onClick={onResetMatchday}>Today</Button>}
          <Button variant="outline" onClick={onRefresh}><RefreshCw size={15} /> Refresh scores</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ledger">
      {Object.values(groups).map((competitionMatches) => {
        const competition = competitionMatches[0].competition;
        return (
          <section key={competition.slug} data-competition-slug={competition.slug} className={cn("competition-section", highlightCompetitionSlug === competition.slug && "competition-section--highlighted")} aria-labelledby={`competition-${competition.slug}`}>
            <header className="competition-section__head">
              <div className="competition-title">
                <CompetitionMark competition={competition} className="competition-title__mark" />
                <div><p className="eyebrow">{competition.region}</p><h2 id={`competition-${competition.slug}`}>{competition.name}</h2></div>
              </div>
              <span className="fixture-count">{competitionMatches.length} {competitionMatches.length === 1 ? "fixture" : "fixtures"}</span>
            </header>
            <div className="match-grid">{competitionMatches.map((match) => <MatchCard key={match.id} match={match} settings={settings} highlighted={highlightMatchId === match.id} onPreview={onPreview} />)}</div>
          </section>
        );
      })}
    </div>
  );
}
