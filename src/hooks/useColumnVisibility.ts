import { useState, useEffect } from "react";
import { authFetch } from "../api/apiAuth";
import { API_ENDPOINTS } from "../api/endpoint";

// ─── Types ────────────────────────────────────────────────────────────────────

type TableVisibility = Record<string, boolean>;
type ColumnsVisibility = Record<string, TableVisibility>;

interface PrefsResponse {
  columns_visibility?: ColumnsVisibility;
}

// ─── Module-level cache ───────────────────────────────────────────────────────
// Shared across all hook instances so every table on the page reuses one fetch.

let _cached: ColumnsVisibility | null = null;
let _fetchPromise: Promise<ColumnsVisibility | null> | null = null;
const _listeners = new Set<(v: ColumnsVisibility) => void>();

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

async function fetchFromApi(): Promise<ColumnsVisibility | null> {
  try {
    const session = JSON.parse(sessionStorage.getItem("user-session") ?? "{}");
    const userId: string = session?.id;
    if (!userId) return null;

    const prefs = await authFetch<PrefsResponse>(
      `${API_ENDPOINTS.preferences}/${userId}`
    );
    return prefs?.columns_visibility ?? null;
  } catch {
    return null;
  }
}

/** Returns the cached visibility, or kicks off the single shared fetch. */
function getOrLoad(): Promise<ColumnsVisibility | null> {
  if (_cached) return Promise.resolve(_cached);
  if (!_fetchPromise) {
    _fetchPromise = fetchFromApi().then((v) => {
      _cached = v;
      return v;
    });
  }
  return _fetchPromise;
}

/** Called by the preferences-updated event to refresh all listening tables. */
function updateGlobalCache(newVisibility: ColumnsVisibility) {
  _cached = newVisibility;
  _fetchPromise = null;
  _listeners.forEach((fn) => fn(newVisibility));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns `isVisible(columnKey)` for the given table name.
 *
 * - Column keys can be `snake_case` (as used in ColumnDef) or `camelCase`.
 *   The hook tries the camelCase version first, then the raw key.
 * - Returns `true` while preferences are still loading, or for any column
 *   not found in the preferences (new columns default to visible).
 * - Reacts in real-time to the `preferences-updated` CustomEvent fired
 *   after the user saves column settings in the profile page.
 *
 * @param table  One of: "transactions" | "supply" | "regions" | "user"
 */
export function useColumnVisibility(table: string) {
  const [visibility, setVisibility] = useState<ColumnsVisibility | null>(_cached);

  // Initial load
  useEffect(() => {
    if (_cached) {
      setVisibility(_cached);
      return;
    }
    getOrLoad().then((v) => {
      if (v) setVisibility(v);
    });

    // Subscribe to future cache updates (e.g. other tabs calling updateGlobalCache)
    const listener = (v: ColumnsVisibility) => setVisibility({ ...v });
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  // Listen for preferences-updated CustomEvent (fired after saving in UserProfile)
  useEffect(() => {
    const handler = (e: Event) => {
      const prefs = (e as CustomEvent<PrefsResponse>).detail;
      if (prefs?.columns_visibility) {
        updateGlobalCache(prefs.columns_visibility);
      }
    };
    window.addEventListener("preferences-updated", handler);
    return () => window.removeEventListener("preferences-updated", handler);
  }, []);

  /**
   * Whether a given column should be shown.
   *
   * @param columnKey  The `key` from `ColumnDef` — accepts `snake_case` or `camelCase`.
   */
  const isVisible = (columnKey: string): boolean => {
    if (!visibility) return true;              // Still loading → show all
    const tableMap = visibility[table];
    if (!tableMap) return true;               // Table not in prefs → show all

    const camelKey = snakeToCamel(columnKey);
    if (camelKey in tableMap) return tableMap[camelKey];
    if (columnKey in tableMap) return tableMap[columnKey];

    return true;                              // Unknown column → show by default
  };

  return { isVisible };
}
