// useDraft — auto-saves an in-flight modal form to localStorage every 5 seconds.
// On mount, exposes the previously-saved draft (or null) so the modal can offer
// "이어서 작성하시겠어요?".
//
// Spec: design-handoff/handoff.html §7 — "5초마다 자동 임시 저장 →
// movieDiary.draft 별도 키".

import { useEffect, useRef, useState } from 'react';
import { clearDraft, loadDraft, saveDraft } from '../lib/storage';
import type { MovieDraft } from '../types';

const SAVE_INTERVAL_MS = 5000;

interface UseDraftResult {
  /** Draft loaded from storage on mount (null if none). */
  initialDraft: MovieDraft | null;
  /** Manually persist the current draft now. */
  flush: (draft: MovieDraft) => void;
  /** Discard the persisted draft. */
  clear: () => void;
}

/**
 * @param enabled  Toggle the auto-save interval. Pass `false` when the modal
 *                 is closed so we don't persist stale state.
 * @param current  Function returning the latest draft value to persist.
 */
export function useDraft(
  enabled: boolean,
  current: () => MovieDraft | null,
): UseDraftResult {
  // Capture once on mount — re-renders shouldn't change "what was there before".
  const [initialDraft] = useState<MovieDraft | null>(() => loadDraft<MovieDraft>());
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      const draft = currentRef.current();
      if (draft) saveDraft({ ...draft, savedAt: new Date().toISOString() });
    }, SAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled]);

  return {
    initialDraft,
    flush: (draft: MovieDraft) =>
      saveDraft({ ...draft, savedAt: new Date().toISOString() }),
    clear: clearDraft,
  };
}
