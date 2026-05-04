// useMovies — typed access to the MoviesContext + a few read helpers.

import { useCallback, useContext, useMemo } from 'react';
import { MoviesContext } from '../store/MoviesContext';
import type { MovieEntry, Settings } from '../types';

export function useMovies() {
  const ctx = useContext(MoviesContext);
  if (!ctx) {
    throw new Error('useMovies must be used inside a <MoviesProvider>.');
  }
  const { state, dispatch, hydrated } = ctx;

  const getEntryById = useCallback(
    (id: string): MovieEntry | undefined => state.entries.find((e) => e.id === id),
    [state.entries],
  );

  /** All entries that share the same TMDB id (= the same film, multiple viewings). */
  const getEntriesByTmdbId = useCallback(
    (tmdbId: number | null): MovieEntry[] => {
      if (tmdbId == null) return [];
      return state.entries.filter((e) => e.tmdbId === tmdbId);
    },
    [state.entries],
  );

  const setSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      dispatch({ type: 'setSetting', payload: { key, value } });
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      // raw state
      state,
      entries: state.entries,
      settings: state.settings,
      hydrated,

      // dispatchers
      dispatch,
      setSetting,

      // selectors
      getEntryById,
      getEntriesByTmdbId,
    }),
    [state, hydrated, dispatch, setSetting, getEntryById, getEntriesByTmdbId],
  );
}
