// useTmdbSearch — fires `/search/movie` against TMDB with 250ms debounce,
// AbortController-based cancellation of previous requests, and named error
// states. Designed for the autocomplete dropdown in MovieModal.
//
// Returns:
//   results : array of TmdbSearchResult (capped to 10 by lib/tmdb.ts)
//   loading : true while the latest non-empty query is in flight
//   error   : TmdbAuthError / TmdbNetworkError / TmdbRateLimitError | null

import { useEffect, useState } from 'react';
import { searchMovies } from '../lib/tmdb';
import { TmdbAuthError, type TmdbSearchResult } from '../types';
import { useDebounce } from './useDebounce';

interface UseTmdbSearchResult {
  results: TmdbSearchResult[];
  loading: boolean;
  error: Error | null;
}

export function useTmdbSearch(query: string, key: string): UseTmdbSearchResult {
  const debounced = useDebounce(query, 250);
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (!key) {
      setResults([]);
      setLoading(false);
      setError(new TmdbAuthError('TMDB API 키가 설정되지 않았습니다.'));
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    searchMovies(trimmed, key, { signal: ctrl.signal })
      .then((rows) => {
        setResults(rows);
        setLoading(false);
      })
      .catch((err: Error) => {
        // AbortError just means we got superseded by a newer request; ignore.
        if (err.name === 'AbortError') return;
        setError(err);
        setResults([]);
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [debounced, key]);

  return { results, loading, error };
}
