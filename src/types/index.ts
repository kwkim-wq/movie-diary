// Movie Diary domain types — see design-handoff/handoff.html §7 for the storage schema.

/** Sort key for the main list view. */
export type SortKey = 'recent' | 'rating' | 'year' | 'title';

/** View mode for the main list view. */
export type ViewMode = 'grid' | 'list';

/**
 * Built-in CSS poster keys used by the Poster component when `posterPath` is null.
 * These correspond to the design-handoff/posters.jsx kinds (DEV seed only — production
 * data should always have a TMDB posterPath).
 */
export type PosterKind =
  | 'wong'
  | 'kubrick'
  | 'noir'
  | 'wes'
  | 'tarkovsky'
  | 'godard'
  | 'kim'
  | 'fellini'
  | 'bong';

/**
 * App-wide settings persisted alongside entries. `tmdbKey` is required for live
 * autocomplete; without it the user only sees their existing entries.
 */
export interface Settings {
  /** TMDB v3 API key entered by the user on first run. Empty string means "not set". */
  tmdbKey: string;
  /** Sort key for the list page. */
  sort: SortKey;
  /** Grid vs list rendering on the list page. */
  view: ViewMode;
}

/**
 * One viewing record — a "page" in the diary. The same movie watched twice yields
 * two MovieEntry rows (so the rating/note can differ). Group by `tmdbId` for the
 * detail page's "previous viewings" timeline.
 */
export interface MovieEntry {
  /** "e_{date}_{title}_{rewatchCount}" — see lib/id.ts. */
  id: string;
  /** TMDB movie id. Optional because the user can also create a manual entry. */
  tmdbId: number | null;
  /** Korean title (or whatever language the user typed). */
  title: string;
  /** Original/English title from TMDB. */
  originalTitle: string;
  /** Release year, e.g. 2000. */
  year: number;
  /** Runtime in minutes. */
  runtime: number;
  /** Director name (single line). */
  director: string;
  /** TMDB poster_path, e.g. "/iYBdgxOuE3rlFXjhU8VZSMfizjV.jpg". null = use posterKind / fallback. */
  posterPath: string | null;
  /** Built-in CSS poster fallback used by sample data. Optional. */
  posterKind?: PosterKind;
  /** Genre labels (Korean). */
  genres: string[];
  /** When the user watched it. ISO 8601 string. */
  watched: string;
  /** Rating in 0.5 steps from 0 to 5. */
  rating: number;
  /** Free-form memo (markdown). */
  note: string;
  /** User tags ("#재관람" with leading "#"). */
  tags: string[];
  /** Heart-favourite flag. */
  liked: boolean;
  /** ISO 8601 — when the entry was first created. */
  createdAt: string;
  /** ISO 8601 — last modification. */
  updatedAt: string;
}

/** Top-level state persisted to localStorage[movieDiary.v1]. */
export interface AppState {
  settings: Settings;
  entries: MovieEntry[];
}

/** Wrapper used for export/import — versioned for future migrations. */
export interface ExportPayload {
  version: 1;
  state: AppState;
  exportedAt: string;
}

/* ─── TMDB API shapes ───────────────────────────────────────────── */
// Trimmed response types — only the fields the UI consumes. Keeps the surface
// small so a TMDB schema change doesn't ripple through the codebase.

/** A single hit from `/search/movie`. */
export interface TmdbSearchResult {
  id: number;
  title: string;
  originalTitle: string;
  year: number; // Parsed from release_date; 0 when unknown.
  posterPath: string | null;
  /** Korean genre labels resolved via GENRE_MAP. */
  genres: string[];
  /** Original `overview` text — handy for tooltips. */
  overview: string;
}

/** Full detail bundle from `/movie/:id?append_to_response=credits`. */
export interface TmdbMovieDetails extends TmdbSearchResult {
  runtime: number; // minutes
  director: string;
  cast: string[]; // top 2 names
}

/** Tagged error classes — callers branch on `instanceof` for nice UX. */
export class TmdbAuthError extends Error {
  constructor(message = 'TMDB API 키가 유효하지 않습니다.') {
    super(message);
    this.name = 'TmdbAuthError';
  }
}

export class TmdbNetworkError extends Error {
  constructor(message = 'TMDB 서버에 연결할 수 없습니다.') {
    super(message);
    this.name = 'TmdbNetworkError';
  }
}

export class TmdbRateLimitError extends Error {
  constructor(message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.') {
    super(message);
    this.name = 'TmdbRateLimitError';
  }
}

/* ─── Modal draft ───────────────────────────────────────────────── */

/** Auto-saved form snapshot. Keep this stable — it lands in localStorage. */
export interface MovieDraft {
  title: string;
  originalTitle: string;
  tmdbId: number | null;
  year: number;
  runtime: number;
  director: string;
  posterPath: string | null;
  genres: string[];
  watched: string;
  rating: number;
  note: string;
  tags: string[];
  liked: boolean;
  /** UTC timestamp the draft was last saved. */
  savedAt: string;
}
