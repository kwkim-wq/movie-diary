// MoviesContext — single source of truth for entries + settings.
// On mount we hydrate from localStorage; every state change is auto-persisted.

import { createContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import type { AppState, MovieEntry, Settings } from '../types';
import { defaultState, loadState, saveState } from '../lib/storage';
import { mergeEntries, pullEntries, pushEntries } from '../lib/sync';

/** All actions the reducer understands. */
export type MoviesAction =
  /** Replace state on initial hydration (fired once on mount). */
  | { type: 'load'; payload: AppState }
  /** Insert a new entry. The reducer stamps createdAt/updatedAt. */
  | { type: 'addEntry'; payload: MovieEntry }
  /** Patch an existing entry by id. */
  | { type: 'updateEntry'; payload: { id: string; patch: Partial<MovieEntry> } }
  /** Remove by id. */
  | { type: 'deleteEntry'; payload: { id: string } }
  /** Toggle the `liked` flag. */
  | { type: 'toggleLike'; payload: { id: string } }
  /** Toggle a single cast member's `liked` flag inside one entry. */
  | { type: 'toggleCastLike'; payload: { entryId: string; castId: number } }
  /** Patch one settings key. */
  | { type: 'setSetting'; payload: { key: keyof Settings; value: Settings[keyof Settings] } }
  /** Replace the entire state (used by JSON import). */
  | { type: 'importState'; payload: AppState };

function reducer(state: AppState, action: MoviesAction): AppState {
  switch (action.type) {
    case 'load':
    case 'importState':
      return action.payload;

    case 'addEntry':
      return { ...state, entries: [action.payload, ...state.entries] };

    case 'updateEntry': {
      const now = new Date().toISOString();
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.payload.id
            ? { ...e, ...action.payload.patch, updatedAt: now }
            : e,
        ),
      };
    }

    case 'deleteEntry':
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.payload.id),
      };

    case 'toggleLike': {
      const now = new Date().toISOString();
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.payload.id ? { ...e, liked: !e.liked, updatedAt: now } : e,
        ),
      };
    }

    case 'toggleCastLike': {
      const { entryId: targetId, castId } = action.payload;
      const now = new Date().toISOString();
      return {
        ...state,
        entries: state.entries.map((e) => {
          if (e.id !== targetId) return e;
          const cast = (e.cast || []).map((c) =>
            c.id === castId ? { ...c, liked: !c.liked } : c,
          );
          return { ...e, cast, updatedAt: now };
        }),
      };
    }

    case 'setSetting':
      return {
        ...state,
        settings: { ...state.settings, [action.payload.key]: action.payload.value },
      };

    default: {
      // Exhaustiveness check.
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/** Shape exposed via context. Keep dispatch raw — useMovies adds helpers. */
export interface MoviesContextValue {
  state: AppState;
  dispatch: React.Dispatch<MoviesAction>;
  /** True until the initial localStorage hydration has run. */
  hydrated: boolean;
}

export const MoviesContext = createContext<MoviesContextValue | null>(null);

export function MoviesProvider({ children }: { children: ReactNode }) {
  // Start from defaults so SSR / first paint never crashes; we hydrate in the effect below.
  const [state, dispatch] = useReducer(reducer, undefined, defaultState);
  // `hydrated` flips after the load action runs so consumers can avoid persisting the
  // empty default over real data (StrictMode mounts effects twice in dev).
  const [hydrated, setHydrated] = useReducer(() => true, false);

  // Hydrate from localStorage exactly once.
  useEffect(() => {
    const initial = loadState();
    dispatch({ type: 'load', payload: initial });
    setHydrated();
  }, []);

  // Persist on every state change — but only after hydration has completed.
  useEffect(() => {
    if (!hydrated) return;
    try {
      saveState(state);
    } catch {
      // saveState already logs; swallow here so React doesn't blow up the tree.
    }
  }, [state, hydrated]);

  // On first hydration: pull from sync server and merge.
  const didPullRef = useRef(false);
  useEffect(() => {
    if (!hydrated || didPullRef.current) return;
    didPullRef.current = true;
    const { syncUrl, syncToken } = state.settings;
    if (!syncUrl || !syncToken) return;
    pullEntries(syncUrl.trim(), syncToken.trim())
      .then((remote) => {
        // Capture current entries via a fresh loadState to avoid stale closure.
        const current = loadState();
        const merged = mergeEntries(current.entries, remote);
        const changed =
          merged.length !== current.entries.length ||
          merged.some((m) => {
            const loc = current.entries.find((e) => e.id === m.id);
            return !loc || loc.updatedAt !== m.updatedAt;
          });
        if (changed) {
          dispatch({ type: 'load', payload: { ...current, entries: merged } });
        }
      })
      .catch((err) => console.warn('[sync] pull failed', err));
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // After every entries change: push to sync server (debounced 1.5 s).
  useEffect(() => {
    if (!hydrated) return;
    const { syncUrl, syncToken } = state.settings;
    if (!syncUrl || !syncToken) return;
    const timer = setTimeout(() => {
      pushEntries(syncUrl.trim(), syncToken.trim(), state.entries).catch((err) =>
        console.warn('[sync] push failed', err),
      );
    }, 1500);
    return () => clearTimeout(timer);
  }, [state.entries, state.settings, hydrated]);

  // Poll every 30 s while the tab is visible — pull and merge remote changes.
  useEffect(() => {
    if (!hydrated) return;
    const { syncUrl, syncToken } = state.settings;
    if (!syncUrl || !syncToken) return;
    const doPoll = () => {
      if (document.visibilityState !== 'visible') return;
      pullEntries(syncUrl.trim(), syncToken.trim())
        .then((remote) => {
          const current = loadState();
          const merged = mergeEntries(current.entries, remote);
          const changed =
            merged.length !== current.entries.length ||
            merged.some((m) => {
              const loc = current.entries.find((e) => e.id === m.id);
              return !loc || loc.updatedAt !== m.updatedAt;
            });
          if (changed) {
            dispatch({ type: 'load', payload: { ...current, entries: merged } });
          }
        })
        .catch(() => {/* silent — polling failures are non-critical */});
    };
    const id = setInterval(doPoll, 30_000);
    return () => clearInterval(id);
  }, [hydrated, state.settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<MoviesContextValue>(
    () => ({ state, dispatch, hydrated }),
    [state, hydrated],
  );

  return <MoviesContext.Provider value={value}>{children}</MoviesContext.Provider>;
}
