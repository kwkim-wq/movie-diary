// localStorage adapter for Movie Diary.
// Storage schema: design-handoff/handoff.html §7.

import type { AppState, ExportPayload, MovieEntry } from '../types';

const STATE_KEY = 'movieDiary.v1';
const DRAFT_KEY = 'movieDiary.draft';

/** Hard cap localStorage uses (browsers vary; 5 MB is a safe ceiling). */
const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024;

/** Default state used on first load. */
export function defaultState(): AppState {
  return {
    settings: {
      tmdbKey: '',
      sort: 'recent',
      view: 'grid',
    },
    entries: [],
  };
}

/** Type guard — accepts a value that *looks like* AppState. */
function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<AppState>;
  return (
    typeof v.settings === 'object' &&
    v.settings !== null &&
    Array.isArray(v.entries)
  );
}

/**
 * Load state from localStorage. On any parse / shape failure we log and return
 * the default — never silently overwrite. (Plan §3, "에러 처리".)
 */
export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState();
  const raw = window.localStorage.getItem(STATE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isAppState(parsed)) {
      console.error('[storage] movieDiary.v1 has unexpected shape; using defaults.', parsed);
      return defaultState();
    }
    // Backfill any new settings keys without losing user data.
    return {
      settings: { ...defaultState().settings, ...parsed.settings },
      entries: parsed.entries,
    };
  } catch (err) {
    console.error('[storage] Failed to parse movieDiary.v1; using defaults.', err);
    return defaultState();
  }
}

/** Persist state. Throws on quota errors so callers can show a toast. */
export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[storage] saveState failed (quota?)', err);
    throw err;
  }
}

/** Modal draft (auto-save while the user is typing). */
export function loadDraft<T = unknown>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error('[storage] Failed to parse movieDiary.draft.', err);
    return null;
  }
}

export function saveDraft(draft: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error('[storage] saveDraft failed.', err);
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DRAFT_KEY);
}

/** Serialize the full app state with a version wrapper for safe migrations. */
export function exportJSON(state: AppState): string {
  const payload: ExportPayload = {
    version: 1,
    state,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Parse an import payload. Throws on shape/version mismatch so the caller can
 * show a useful error to the user (no silent overwrite).
 */
export function importJSON(text: string): AppState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`JSON 파싱 실패: ${(err as Error).message}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('유효하지 않은 파일입니다.');
  }
  const obj = parsed as Partial<ExportPayload>;
  if (obj.version !== 1) {
    throw new Error(`지원하지 않는 버전입니다: ${String(obj.version)}`);
  }
  if (!isAppState(obj.state)) {
    throw new Error('파일 구조가 올바르지 않습니다.');
  }
  // Light per-entry validation — bail on the first malformed row.
  const malformed = (obj.state.entries as MovieEntry[]).find(
    (e) => typeof e?.id !== 'string' || typeof e?.title !== 'string',
  );
  if (malformed !== undefined) {
    throw new Error('일부 기록의 형식이 올바르지 않습니다.');
  }
  return obj.state;
}

/** Approximate localStorage usage. Returns bytes + percent of a 5 MB budget. */
export function getStorageUsage(): { bytes: number; percent: number } {
  if (typeof window === 'undefined') return { bytes: 0, percent: 0 };
  const main = window.localStorage.getItem(STATE_KEY) ?? '';
  const draft = window.localStorage.getItem(DRAFT_KEY) ?? '';
  // Browsers use UTF-16 internally, so 2 bytes per code unit is a reasonable upper bound.
  const bytes = (main.length + draft.length) * 2;
  return {
    bytes,
    percent: Math.min(100, (bytes / STORAGE_BUDGET_BYTES) * 100),
  };
}

export const STORAGE_KEYS = { state: STATE_KEY, draft: DRAFT_KEY } as const;
