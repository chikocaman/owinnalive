import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { RefreshCw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateNavigator } from "@/components/DateNavigator";
import { MatchFilters, type SearchSuggestion } from "@/components/MatchFilters";
import { MatchLedger } from "@/components/MatchLedger";
const SettingsDrawer = lazy(() => import("@/components/SettingsDrawer").then((module) => ({ default: module.SettingsDrawer })));
import { useFootyScores } from "@/hooks/useFootyScores";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { STORAGE } from "@/lib/constants";
import { catDateKey } from "@/lib/espn";
import { DEFAULT_MATCH_FILTERS, type FilterKey, type Match, type MatchFilterState } from "@/lib/types";
import { toast } from "sonner";
import { MatchPreviewDrawer } from "@/components/MatchPreviewDrawer";
import { parsePersistedView } from "@/lib/view-state";
import { disablePushNotifications, enablePushNotifications, getPushStatus, sendPushTest, type PushStatus } from "@/lib/push-client";

function readFilter(): FilterKey {
  return parsePersistedView(localStorage.getItem(STORAGE.view)).filter || "all";
}

function readAdvancedFilters(): MatchFilterState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE.view) || "null") as { advancedFilters?: Partial<MatchFilterState> } | null;
    return { ...DEFAULT_MATCH_FILTERS, ...(parsed?.advancedFilters || {}), competitionType: parsed?.advancedFilters?.competitionType || "all" };
  } catch {
    return DEFAULT_MATCH_FILTERS;
  }
}

export default function Home() {
  const scoreDesk = useFootyScores();
  const [, navigate] = useLocation();
  const isCalendarHidden = useScrollDirection();
  const [filter, setFilter] = useState<FilterKey>(readFilter);
  const [query, setQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [highlightMatchId, setHighlightMatchId] = useState<string | null>(null);
  const [highlightCompetitionSlug, setHighlightCompetitionSlug] = useState<string | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<MatchFilterState>(readAdvancedFilters);
  const [pushStatus, setPushStatus] = useState<PushStatus>("default");
  const [previewMatch, setPreviewMatch] = useState<Match | null>(null);
  const availableTeams = useMemo(() => Array.from(new Map(scoreDesk.data.matches.flatMap((match) => [match.home, match.away]).map((team) => [team.id || team.name, { id: team.id || team.name, name: team.name }])).values()).sort((a, b) => a.name.localeCompare(b.name)), [scoreDesk.data.matches]);

  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE.view) || "{}") as { dateKey?: string };
      localStorage.setItem(STORAGE.view, JSON.stringify({ ...current, filter }));
    } catch {
      // Storage is optional; the current session remains fully usable.
    }
  }, [filter]);

  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE.view) || "{}") as Record<string, unknown>;
      localStorage.setItem(STORAGE.view, JSON.stringify({ ...current, advancedFilters }));
    } catch {
      // Storage is optional; the current session remains fully usable.
    }
  }, [advancedFilters]);

  useEffect(() => {
    void getPushStatus().then(setPushStatus).catch(() => setPushStatus("error"));
  }, []);

  const handlePushToggle = async (enabled: boolean) => {
    try {
      const next = enabled ? await enablePushNotifications() : await disablePushNotifications();
      setPushStatus(next);
      scoreDesk.updateSettings({ notifications: { ...scoreDesk.settings.notifications, enabled: next === "subscribed" } });
      toast.success(next === "subscribed" ? "Background alerts enabled" : "Background alerts paused");
    } catch (error) {
      setPushStatus("error");
      scoreDesk.updateSettings({ notifications: { ...scoreDesk.settings.notifications, enabled: false } });
      toast.error(error instanceof Error ? error.message : "Unable to configure push notifications");
    }
  };

  const handlePushTest = async () => {
    try {
      await sendPushTest();
      toast.success("Test notification sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send test notification");
    }
  };

  useEffect(() => {
    if (!scoreDesk.data.isLoading && scoreDesk.data.matches.length > 0 && filter !== "all" && !scoreDesk.data.matches.some((match) => match.status === filter)) setFilter("all");
  }, [filter, scoreDesk.data.isLoading, scoreDesk.data.matches]);


  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    const normalized = suggestion.label.toLocaleLowerCase();
    const match = scoreDesk.data.matches.find((candidate) => {
      if (suggestion.kind === "Competition") return candidate.competition.name.toLocaleLowerCase() === normalized;
      if (suggestion.kind === "Player") return candidate.goals.some((goal) => goal.scorer.toLocaleLowerCase() === normalized);
      return candidate.home.name.toLocaleLowerCase() === normalized || candidate.away.name.toLocaleLowerCase() === normalized;
    });
    if (!match) return;
    setHighlightMatchId(suggestion.kind === "Competition" ? null : match.id);
    setHighlightCompetitionSlug(match.competition.slug);
    window.setTimeout(() => {
      let element: HTMLElement | undefined;
      if (suggestion.kind === "Competition") {
        element = Array.from(document.querySelectorAll("[data-competition-slug]") as NodeListOf<HTMLElement>).find((node) => node.dataset.competitionSlug === match.competition.slug);
      } else {
        element = document.getElementById(`match-${match.id}`) || undefined;
      }
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    window.setTimeout(() => {
      setHighlightMatchId(null);
      setHighlightCompetitionSlug(null);
    }, 3200);
  };

  return (
    <main className="app-page">
      <header className="masthead">
        <div className="masthead__inner">
          <a href="#top" className="brand" aria-label="FootyScores Pro home">
            <svg className="brand__logo" viewBox="0 0 40 40" role="img" aria-label="FootyScores mark"><circle cx="20" cy="20" r="18" fill="#f35d4f" /><path d="M20 7v26M7 20h26M13 12c4 3 10 3 14 0M13 28c4-3 10-3 14 0" fill="none" stroke="#fff" strokeWidth="2" /></svg>
            <span className="brand__wordmark" aria-label="FootyScores Pro"><strong>FOOTY</strong><b>SCORES</b><em>PRO</em></span>
          </a>
          <div className="masthead__tools">
            <MatchFilters matches={scoreDesk.data.matches} value={filter} onChange={setFilter} query={query} onQueryChange={setQuery} onSuggestionSelect={handleSuggestionSelect} compact />
            <MatchFilters matches={scoreDesk.data.matches} value={filter} onChange={setFilter} query={query} onQueryChange={setQuery} filtersOnly advanced={advancedFilters} onAdvancedChange={setAdvancedFilters} />
            <Button variant="ghost" className="header-button" onClick={() => void scoreDesk.refresh(true)} disabled={scoreDesk.data.isRefreshing} aria-label="Refresh scores">
              <RefreshCw size={16} className={scoreDesk.data.isRefreshing ? "spin" : ""} /> <span className="header-button__label">Refresh</span>
            </Button>
            <Link href="/my-desk" className="header-button" asChild><Button variant="ghost" aria-label="Open My Desk"><span className="header-button__label">My Desk</span></Button></Link>
            <Button className="settings-button" onClick={() => setSettingsOpen(true)}><Settings2 size={16} /> <span className="settings-button__label">Settings</span></Button>
          </div>
        </div>
      </header>

      <div className="workspace">
        <section className="match-workspace" aria-label="Football match desk">
          <div className={`match-command-bar ${isCalendarHidden ? "match-command-bar--hidden" : ""}`} aria-label="Matchday and date controls">
            {/* DateNavigator is the canonical date filter; advanced filters refine this selected matchday. */}
            <DateNavigator value={scoreDesk.dateKey} onChange={scoreDesk.setDateKey} compact />
          </div>
          <MatchLedger matches={scoreDesk.data.matches} settings={scoreDesk.settings} filter={filter} query={query} isLoading={scoreDesk.data.isLoading} error={scoreDesk.data.error} onRefresh={() => void scoreDesk.refresh(true)} onClearFilters={() => { setFilter("all"); setQuery(""); setAdvancedFilters(DEFAULT_MATCH_FILTERS); }} onResetMatchday={() => scoreDesk.setDateKey(catDateKey(new Date()))} highlightMatchId={highlightMatchId} highlightCompetitionSlug={highlightCompetitionSlug} filters={advancedFilters} onPreview={setPreviewMatch} />
        </section>
      </div>

      <MatchPreviewDrawer match={previewMatch} settings={scoreDesk.settings} onClose={() => setPreviewMatch(null)} onOpenRoute={(matchId) => { setPreviewMatch(null); navigate(`/match/${encodeURIComponent(matchId)}`); }} />

      <Suspense fallback={null}><SettingsDrawer
        open={settingsOpen}
        onClose={() => { setSettingsOpen(false); setBrowseOpen(false); }}
        browseOpen={browseOpen}
        onBrowseOpen={setBrowseOpen}
        settings={scoreDesk.settings}
        directory={scoreDesk.directory}
        directoryLoading={scoreDesk.directoryLoading}
        directoryError={scoreDesk.directoryError}
        onUpdate={scoreDesk.updateSettings}
        onToggleCompetition={scoreDesk.toggleCompetition}
        onTogglePinnedTeam={scoreDesk.togglePinnedTeam}
        availableTeams={availableTeams}
        pushStatus={pushStatus}
        onPushToggle={handlePushToggle}
        onPushTest={handlePushTest}
      /></Suspense>
    </main>
  );
}
