// useMovies — typed access to the MoviesContext + a few read helpers.

import { useCallback, useContext, useMemo } from 'react';
import { aggregateActors, entriesByActor } from '../lib/filters';
import { MoviesContext } from '../store/MoviesContext';
import type { ActorSummary, CastMember, MovieEntry, Settings } from '../types';

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

  /** Toggle one cast member's heart inside one entry. Thin dispatch wrapper. */
  const toggleCastLike = useCallback(
    (entryId: string, castId: number) => {
      dispatch({ type: 'toggleCastLike', payload: { entryId, castId } });
    },
    [dispatch],
  );

  /**
   * Aggregated row per unique actor across the whole library. Cheap enough at
   * v1 scale (memoised on entries reference) — revisit if entries grow huge.
   */
  const getAllActors = useCallback((): ActorSummary[] => {
    return aggregateActors(state.entries);
  }, [state.entries]);

  /**
   * Bundle for the /actor/:id detail page: the canonical actor record (any
   * occurrence — first wins), every entry that mentions them, and an OR-rolled
   * `likedInAny` flag. Returns null when no entry mentions the id.
   */
  const getCastById = useCallback(
    (
      actorId: number,
    ): { actor: CastMember; movies: MovieEntry[]; likedInAny: boolean } | null => {
      const movies = entriesByActor(state.entries, actorId);
      if (movies.length === 0) return null;
      // Find a canonical CastMember record — prefer one with a profile path.
      let chosen: CastMember | undefined;
      let likedInAny = false;
      for (const m of movies) {
        for (const c of m.cast || []) {
          if (c.id !== actorId) continue;
          if (!chosen || (!chosen.profilePath && c.profilePath)) chosen = c;
          if (c.liked) likedInAny = true;
        }
      }
      if (!chosen) return null;
      return { actor: chosen, movies, likedInAny };
    },
    [state.entries],
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
      toggleCastLike,

      // selectors
      getEntryById,
      getEntriesByTmdbId,
      getAllActors,
      getCastById,
    }),
    [
      state,
      hydrated,
      dispatch,
      setSetting,
      toggleCastLike,
      getEntryById,
      getEntriesByTmdbId,
      getAllActors,
      getCastById,
    ],
  );
}
