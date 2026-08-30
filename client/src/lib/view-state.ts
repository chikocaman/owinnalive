import type { FilterKey } from "./types";

export interface PersistedView {
  dateKey?: string;
  filter?: FilterKey;
}

const FILTERS: FilterKey[] = ["all", "live", "upcoming", "finished", "postponed"];

export function parsePersistedView(raw: string | null): PersistedView {
  try {
    const parsed = JSON.parse(raw || "null") as PersistedView | null;
    return {
      dateKey: parsed?.dateKey,
      filter: parsed?.filter && FILTERS.includes(parsed.filter) ? parsed.filter : "all",
    };
  } catch {
    return { filter: "all" };
  }
}
