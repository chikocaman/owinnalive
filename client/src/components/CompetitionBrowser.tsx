/**
 * FootyScores Pro — Matchday Ledger component.
 * This drawer is a research index: search is tolerant, regions remain visible, selection is immediate.
 */

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CompetitionMark } from "@/components/CompetitionMark";
import { groupCompetitions, matchesCompetition } from "@/lib/competition-search";
import type { Competition } from "@/lib/types";

interface CompetitionBrowserProps {
  directory: Competition[];
  selectedSlugs: string[];
  loading: boolean;
  error: string | null;
  onToggle: (slug: string) => void;
}

function CompetitionLogo({ competition }: { competition: Competition }) {
  return <CompetitionMark competition={competition} className="browse-league__logo" />;
}

export function CompetitionBrowser({ directory, selectedSlugs, loading, error, onToggle }: CompetitionBrowserProps) {
  const [query, setQuery] = useState("");
  const [openRegions, setOpenRegions] = useState<string[]>([]);
  const results = useMemo(() => directory.filter((competition) => matchesCompetition(competition, query)), [directory, query]);
  const groups = useMemo(() => groupCompetitions(results), [results]);
  const regionEntries = Object.entries(groups);
  const searching = Boolean(query.trim());

  const toggleRegion = (region: string) => setOpenRegions((current) => current.includes(region) ? current.filter((item) => item !== region) : [...current, region]);
  const selectRegion = (leagues: Competition[]) => {
    const unselected = leagues.filter((competition) => !selectedSlugs.includes(competition.slug));
    unselected.forEach((competition) => onToggle(competition.slug));
  };

  return (
    <div className="competition-browser">
      <div className="browser-intro">
        <div className="browser-intro__icon"><Sparkles size={16} /></div>
        <p><b>Build your desk.</b> Search 200+ ESPN competitions by name, abbreviation, or region. Changes are saved instantly.</p>
      </div>
      <label className="directory-search">
        <Search size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “wafcon”, “ucl”, “women afcon”…" autoFocus />
        {query && <span>{results.length}</span>}
      </label>

      {loading && <div className="browser-loading"><span className="spin-ring" /> Loading the competition directory…</div>}
      {!loading && error && <div className="browser-note browser-note--error">{error}</div>}
      {!loading && !results.length && <div className="browser-empty"><Search size={22} /><b>No competitions found for “{query}”</b><span>Try the full name, an abbreviation, or a region.</span></div>}

      {searching && results.length > 0 && (
        <div className="search-results" aria-label="Competition search results">
          {results.map((competition) => <LeagueRow key={competition.slug} competition={competition} selected={selectedSlugs.includes(competition.slug)} onToggle={onToggle} showRegion />)}
        </div>
      )}

      {!searching && regionEntries.map(([region, leagues]) => {
        const open = openRegions.includes(region) || regionEntries.length <= 7;
        const count = leagues.filter((league) => selectedSlugs.includes(league.slug)).length;
        return (
          <section className="directory-region" key={region}>
            <div className="directory-region__head">
              <button type="button" className="directory-region__toggle" onClick={() => toggleRegion(region)} aria-expanded={open}>
                <ChevronDown size={16} className={cn(!open && "-rotate-90")} />
                <span>{region}</span><small>{leagues.length} competitions · {count} selected</small>
              </button>
              <Button variant="ghost" size="sm" className="select-region-button" onClick={() => selectRegion(leagues)}>Select all</Button>
            </div>
            {open && <div className="directory-region__list">{leagues.map((competition) => <LeagueRow key={competition.slug} competition={competition} selected={selectedSlugs.includes(competition.slug)} onToggle={onToggle} />)}</div>}
          </section>
        );
      })}
    </div>
  );
}

function LeagueRow({ competition, selected, onToggle, showRegion = false }: { competition: Competition; selected: boolean; onToggle: (slug: string) => void; showRegion?: boolean }) {
  return (
    <button type="button" className={cn("browse-league", selected && "browse-league--selected")} onClick={() => onToggle(competition.slug)} aria-pressed={selected}>
      <CompetitionLogo competition={competition} />
      <span className="browse-league__text"><b>{competition.name}</b>{showRegion && <small>{competition.region}</small>}</span>
      <span className="browse-league__check">{selected && <Check size={14} />}</span>
    </button>
  );
}
