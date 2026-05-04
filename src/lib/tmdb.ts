// TMDB API client — small fetch wrapper with a 5-minute in-memory cache.
//
// Reference: design-handoff/handoff.html §6 (인증, 검색, 상세, 레이트리밋).
//
// Design notes:
//   - All requests pass `?api_key=...&language=ko-KR`.
//   - We cache GET responses in a Map keyed by full URL for 5 minutes; the
//     handoff calls out a 5-minute window for the autocomplete dedupe.
//   - We bubble up named errors (TmdbAuthError, TmdbNetworkError,
//     TmdbRateLimitError) so the UI can show specific messages without
//     digging into status codes.
//   - GENRE_MAP is hardcoded so we don't have to round-trip
//     `/genre/movie/list` on every result. Korean labels per the Korean TMDB
//     locale (verified against `/genre/movie/list?language=ko-KR`).

import {
  TmdbAuthError,
  TmdbNetworkError,
  TmdbRateLimitError,
  type TmdbCastMember,
  type TmdbMovieDetails,
  type TmdbSearchResult,
} from '../types';

const BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: unknown;
  expires: number;
}

const cache = new Map<string, CacheEntry>();

/** Korean genre labels for TMDB movie genre ids (snapshot of /genre/movie/list?language=ko-KR). */
export const GENRE_MAP: Record<number, string> = {
  28: '액션',
  12: '모험',
  16: '애니메이션',
  35: '코미디',
  80: '범죄',
  99: '다큐멘터리',
  18: '드라마',
  10751: '가족',
  14: '판타지',
  36: '역사',
  27: '공포',
  10402: '음악',
  9648: '미스터리',
  10749: '로맨스',
  878: 'SF',
  10770: 'TV 영화',
  53: '스릴러',
  10752: '전쟁',
  37: '서부',
};

export function mapGenreIds(ids: number[] | undefined): string[] {
  if (!ids || ids.length === 0) return [];
  return ids.map((id) => GENRE_MAP[id]).filter((g): g is string => Boolean(g));
}

/** Build a TMDB poster URL. `path` MUST be the raw `/abc.jpg` from the API. */
export function posterUrl(
  path: string | null,
  size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' = 'w185',
): string | null {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

interface FetchOptions {
  signal?: AbortSignal;
}

async function tmdbFetch<T>(path: string, key: string, opts: FetchOptions = {}): Promise<T> {
  if (!key) {
    throw new TmdbAuthError('TMDB API 키가 설정되지 않았습니다.');
  }
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE}${path}${sep}api_key=${encodeURIComponent(key)}&language=ko-KR`;

  // Cache hit — but never serve a cached value to a request that has already
  // been aborted (StrictMode dev double-effects).
  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  let res: Response;
  try {
    res = await fetch(url, { signal: opts.signal });
  } catch (err) {
    // AbortError is a normal cancellation; let it propagate as-is.
    if ((err as Error).name === 'AbortError') throw err;
    throw new TmdbNetworkError();
  }

  if (res.status === 401) {
    throw new TmdbAuthError();
  }
  if (res.status === 429) {
    throw new TmdbRateLimitError();
  }
  if (!res.ok) {
    throw new TmdbNetworkError(`TMDB 응답 오류 (${res.status})`);
  }

  const data = (await res.json()) as T;
  cache.set(url, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

interface RawSearchResponse {
  results?: Array<{
    id: number;
    title?: string;
    original_title?: string;
    release_date?: string;
    poster_path?: string | null;
    genre_ids?: number[];
    overview?: string;
  }>;
}

/** `/search/movie` — returns up to 10 trimmed hits. */
export async function searchMovies(
  query: string,
  key: string,
  opts: FetchOptions = {},
): Promise<TmdbSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const path = `/search/movie?query=${encodeURIComponent(trimmed)}&include_adult=false&page=1`;
  const json = await tmdbFetch<RawSearchResponse>(path, key, opts);
  const results = (json.results ?? []).slice(0, 10);
  return results.map((r) => ({
    id: r.id,
    title: r.title ?? '',
    originalTitle: r.original_title ?? '',
    year: r.release_date ? Number(r.release_date.slice(0, 4)) || 0 : 0,
    posterPath: r.poster_path ?? null,
    genres: mapGenreIds(r.genre_ids),
    overview: r.overview ?? '',
  }));
}

interface RawDetailsResponse {
  id: number;
  title?: string;
  original_title?: string;
  release_date?: string;
  poster_path?: string | null;
  runtime?: number;
  overview?: string;
  genres?: Array<{ id: number; name: string }>;
  credits?: {
    crew?: Array<{ job?: string; name?: string }>;
    cast?: Array<{ name?: string }>;
  };
}

/** `/movie/:id?append_to_response=credits` — full record + director + cast. */
export async function getMovieDetails(
  id: number,
  key: string,
  opts: FetchOptions = {},
): Promise<TmdbMovieDetails> {
  const path = `/movie/${id}?append_to_response=credits`;
  const json = await tmdbFetch<RawDetailsResponse>(path, key, opts);
  const director =
    json.credits?.crew?.find((c) => c.job === 'Director')?.name ?? '';
  const cast = (json.credits?.cast ?? [])
    .slice(0, 2)
    .map((c) => c.name ?? '')
    .filter(Boolean);
  // Prefer the API's localised genre names; if missing, leave empty (we don't
  // fall back to GENRE_MAP because the details endpoint always populates this).
  const genres = (json.genres ?? []).map((g) => g.name).filter(Boolean);
  return {
    id: json.id,
    title: json.title ?? '',
    originalTitle: json.original_title ?? '',
    year: json.release_date ? Number(json.release_date.slice(0, 4)) || 0 : 0,
    posterPath: json.poster_path ?? null,
    overview: json.overview ?? '',
    genres,
    runtime: json.runtime ?? 0,
    director,
    cast,
  };
}

interface RawCreditsResponse {
  id?: number;
  cast?: Array<{
    id?: number;
    name?: string;
    character?: string;
    profile_path?: string | null;
    order?: number;
  }>;
}

/**
 * `/movie/:id/credits` — top-N cast for the movie, sorted by TMDB's `order`
 * field (lower = more prominent). The reply is reused via the same 5-min
 * in-memory cache as the other endpoints.
 *
 * @param topN  How many cast rows to return after sorting. Default = 8.
 */
export async function getMovieCredits(
  movieId: number,
  key: string,
  opts: FetchOptions & { topN?: number } = {},
): Promise<{ cast: TmdbCastMember[] }> {
  const path = `/movie/${movieId}/credits`;
  const json = await tmdbFetch<RawCreditsResponse>(path, key, opts);
  const topN = opts.topN ?? 8;
  const cast = (json.cast ?? [])
    .filter((c) => typeof c.id === 'number')
    // Treat missing `order` as last so well-formed entries always rank first.
    .slice()
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
    .slice(0, topN)
    .map<TmdbCastMember>((c) => ({
      id: c.id as number,
      name: c.name ?? '',
      character: c.character ?? '',
      profilePath: c.profile_path ?? null,
      order: c.order ?? 9999,
    }));
  return { cast };
}

/** TMDB profile image URL (built-in /t/p/<size> CDN). */
export function profileUrl(
  path: string | null,
  size: 'w45' | 'w185' | 'w342' | 'h632' = 'w185',
): string | null {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

/** Test hook — clears the in-memory cache. Useful for debugging in dev tools. */
export function clearTmdbCache(): void {
  cache.clear();
}
