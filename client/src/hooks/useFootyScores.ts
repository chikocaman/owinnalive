/**
 * FootyScores Pro — Matchday Ledger state controller.
 * A single React hook coordinates preferences, directory caching, and live ESPN refreshes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_COMPETITIONS, DEFAULT_SETTINGS, SCORE_REFRESH_INTERVAL_MS, STORAGE } from "@/lib/constants";
import { catDateKey, getDirectory, loadMatches } from "@/lib/espn";
import type { AppSettings, Competition, DataState, Match } from "@/lib/types";
import { parsePersistedView } from "@/lib/view-state";
import { canStartRefresh } from "@/lib/refresh-coordination";

function readView() {
  return parsePersistedView(localStorage.getItem(STORAGE.view)).dateKey || catDateKey(new Date());
}

function readSettings(): AppSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE.settings) || "null") as Partial<AppSettings> | null;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      selectedSlugs: Array.from(new Set([...(parsed?.selectedSlugs?.length ? parsed.selectedSlugs : DEFAULT_SETTINGS.selectedSlugs), "malawi.super-league"])),
      pinnedTeamIds: Array.isArray(parsed?.pinnedTeamIds) ? parsed.pinnedTeamIds : DEFAULT_SETTINGS.pinnedTeamIds,
      displayTimezone: parsed?.displayTimezone === "local" ? "local" : DEFAULT_SETTINGS.displayTimezone,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed?.notifications || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useFootyScores() {
  const [settings, setSettings] = useState<AppSettings>(readSettings);
  const [dateKey, setDateKey] = useState(readView);
  const [directory, setDirectory] = useState<Competition[]>(DEFAULT_COMPETITIONS);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [data, setData] = useState<DataState>({ matches: [], isLoading: true, isRefreshing: false, error: null, lastUpdated: null });
  const refreshRequestRef = useRef(0);
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const previous = parsePersistedView(localStorage.getItem(STORAGE.view));
    localStorage.setItem(STORAGE.view, JSON.stringify({ ...previous, dateKey }));
  }, [dateKey]);

  useEffect(() => {
    let current = true;
    setDirectoryLoading(true);
    getDirectory()
      .then((competitions) => {
        if (!current) return;
        setDirectory(competitions);
        setDirectoryError(null);
      })
      .catch(() => {
        if (!current) return;
        setDirectoryError("Competition search is temporarily unavailable. Your selected leagues can still load.");
      })
      .finally(() => current && setDirectoryLoading(false));
    return () => {
      current = false;
    };
  }, []);

  const selectedCompetitions = useMemo(() => {
    const map = new Map(directory.map((competition) => [competition.slug, competition]));
    return settings.selectedSlugs.map((slug) => map.get(slug) || DEFAULT_COMPETITIONS.find((competition) => competition.slug === slug)).filter(Boolean) as Competition[];
  }, [directory, settings.selectedSlugs]);
  const selectedSlugsKey = settings.selectedSlugs.join("|");

  const matchesRef = useRef<Match[]>([]);
  useEffect(() => {
    matchesRef.current = data.matches;
  }, [data.matches]);

  const refresh = useCallback(
    async (refreshing = false) => {
      // Never let the 15-second poll invalidate a slower but valid score load.
      // A completed request schedules the next poll naturally; manual refreshes
      // also become no-ops while the current source request is still active.
      if (!canStartRefresh(refreshInFlightRef.current)) return;
      refreshInFlightRef.current = true;
      const requestId = ++refreshRequestRef.current;
      if (!selectedCompetitions.length) {
        setData({ matches: [], isLoading: false, isRefreshing: false, error: null, lastUpdated: Date.now() });
        refreshInFlightRef.current = false;
        return;
      }
      setData((previous) => ({ ...previous, isLoading: !refreshing, isRefreshing: refreshing, error: null }));
      const loadingWatchdog = window.setTimeout(() => {
        if (requestId !== refreshRequestRef.current) return;
        setData((previous) => ({
          ...previous,
          isLoading: false,
          isRefreshing: false,
          error: previous.matches.length ? "Score sources are taking longer than expected. Showing the last available fixtures." : "Score sources are taking longer than expected. Try Refresh scores in a moment.",
          lastUpdated: Date.now(),
        }));
      }, 16_000);
      try {
        // Passing the previous poll's matches lets score enrichment skip
        // matches that haven't changed instead of re-fetching every live
        // match's detail on every 15s tick (see alreadyFullyEnriched in espn.ts).
        const result = await Promise.race([
          loadMatches(selectedCompetitions, dateKey, matchesRef.current),
          new Promise<{ matches: Match[]; errors: string[] }>((resolve) =>
            window.setTimeout(() => resolve({ matches: [], errors: ["Score sources timed out"] }), 20_000),
          ),
        ]);
        if (requestId !== refreshRequestRef.current) return;
        window.clearTimeout(loadingWatchdog);
        setData((previous) => ({
          matches: result.matches.length ? result.matches : previous.matches,
          isLoading: false,
          isRefreshing: false,
          error: result.errors.length === selectedCompetitions.length || result.errors.includes("Score sources timed out")
            ? "Score sources are taking longer than expected. Showing the last available fixtures; try Refresh in a moment."
            : null,
          lastUpdated: Date.now(),
        }));
      } catch {
        window.clearTimeout(loadingWatchdog);
        if (requestId !== refreshRequestRef.current) return;
        setData((previous) => ({ ...previous, isLoading: false, isRefreshing: false, error: "Scores could not be loaded right now. Please try Refresh." }));
      } finally {
        refreshInFlightRef.current = false;
      }
    },
    [dateKey, selectedSlugsKey, selectedCompetitions],
  );

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void refresh(true);
    };
    const interval = window.setInterval(refreshIfVisible, SCORE_REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [refresh]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => setSettings((previous) => ({ ...previous, ...patch })), []);
  const toggleCompetition = useCallback((slug: string) => {
    setSettings((previous) => ({
      ...previous,
      selectedSlugs: previous.selectedSlugs.includes(slug)
        ? previous.selectedSlugs.filter((item) => item !== slug)
        : [...previous.selectedSlugs, slug],
    }));
  }, []);
  const togglePinnedTeam = useCallback((teamId: string) => {
    setSettings((previous) => ({
      ...previous,
      pinnedTeamIds: previous.pinnedTeamIds.includes(teamId)
        ? previous.pinnedTeamIds.filter((item) => item !== teamId)
        : [...previous.pinnedTeamIds, teamId],
    }));
  }, []);

  return {
    settings,
    updateSettings,
    toggleCompetition,
    togglePinnedTeam,
    dateKey,
    setDateKey,
    directory,
    directoryLoading,
    directoryError,
    selectedCompetitions,
    data,
    refresh,
  };
}
