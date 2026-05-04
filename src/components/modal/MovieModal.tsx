// MovieModal — Add / Edit form. Layout follows design-handoff/scene-modal.jsx.
//
// Props: none. The modal observes ?modal=new and ?modal=edit&id=… on the URL
// and decides what to render. Closing strips the params (preserving anything
// else the URL was carrying).
//
// Behaviour summary:
//   - body { overflow: hidden } while open.
//   - Esc / backdrop click closes; if there are unsaved changes the user gets
//     a confirm dialog (per handoff §4.3).
//   - ⌘Enter / Ctrl+Enter saves.
//   - Auto-saves the in-flight draft to localStorage every 5s. On (re)open,
//     if a draft exists for a *new* entry the user is offered "이어서 작성".
//   - TMDB autocomplete pre-fills title, originalTitle, year, posterPath,
//     genres; on selection we also fetch /movie/:id to back-fill runtime +
//     director.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDraft } from '../../hooks/useDraft';
import { useMovies } from '../../hooks/useMovies';
import { entryId } from '../../lib/id';
import { getMovieDetails } from '../../lib/tmdb';
import type { MovieDraft, MovieEntry, TmdbSearchResult } from '../../types';
import { StarInput } from './StarInput';
import { TagInput } from './TagInput';
import { TmdbAutocomplete } from './TmdbAutocomplete';

const MAX_NOTE = 2000;

function todayDateValue(): string {
  // <input type="date"> wants YYYY-MM-DD in local time.
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function emptyDraft(): MovieDraft {
  return {
    title: '',
    originalTitle: '',
    tmdbId: null,
    year: 0,
    runtime: 0,
    director: '',
    posterPath: null,
    genres: [],
    watched: todayDateValue(),
    rating: 0,
    note: '',
    tags: [],
    liked: false,
    savedAt: '',
  };
}

function entryToDraft(e: MovieEntry): MovieDraft {
  return {
    title: e.title,
    originalTitle: e.originalTitle,
    tmdbId: e.tmdbId,
    year: e.year,
    runtime: e.runtime,
    director: e.director,
    posterPath: e.posterPath,
    genres: e.genres ?? [],
    // Date-only for the form; timestamp added back on save.
    watched: (e.watched || '').slice(0, 10) || todayDateValue(),
    rating: e.rating,
    note: e.note,
    tags: e.tags ?? [],
    liked: e.liked,
    savedAt: '',
  };
}

function draftsAreEqual(a: MovieDraft, b: MovieDraft): boolean {
  if (a.title !== b.title) return false;
  if (a.originalTitle !== b.originalTitle) return false;
  if (a.tmdbId !== b.tmdbId) return false;
  if (a.year !== b.year) return false;
  if (a.runtime !== b.runtime) return false;
  if (a.director !== b.director) return false;
  if (a.posterPath !== b.posterPath) return false;
  if (a.watched !== b.watched) return false;
  if (a.rating !== b.rating) return false;
  if (a.note !== b.note) return false;
  if (a.liked !== b.liked) return false;
  if ((a.genres || []).join('|') !== (b.genres || []).join('|')) return false;
  if ((a.tags || []).join('|') !== (b.tags || []).join('|')) return false;
  return true;
}

export function MovieModal() {
  const [searchParams] = useSearchParams();
  const { getEntryById, hydrated } = useMovies();

  const modalParam = searchParams.get('modal');
  const editId = searchParams.get('id') ?? '';
  const mode: 'new' | 'edit' | null =
    modalParam === 'edit' ? 'edit' : modalParam === 'new' ? 'new' : null;
  const isOpen = mode === 'new' || mode === 'edit';

  const editTarget = useMemo<MovieEntry | undefined>(() => {
    if (mode !== 'edit' || !editId) return undefined;
    return getEntryById(decodeURIComponent(editId));
  }, [mode, editId, getEntryById]);

  // Re-mount the shell on every open via a key reset so internal state always
  // matches the chosen mode (new vs edit).
  const formKey = `${mode ?? 'closed'}:${editId}`;

  if (!hydrated || !isOpen || !mode) return null;

  return <ModalShell key={formKey} mode={mode} editTarget={editTarget} />;
}

interface ModalShellProps {
  mode: 'new' | 'edit';
  editTarget: MovieEntry | undefined;
}

function ModalShell({ mode, editTarget }: ModalShellProps) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { dispatch, entries, settings } = useMovies();

  // --- form state ---
  const baseline = useMemo<MovieDraft>(
    () => (mode === 'edit' && editTarget ? entryToDraft(editTarget) : emptyDraft()),
    [mode, editTarget],
  );
  const [draft, setDraft] = useState<MovieDraft>(baseline);

  // Draft hook — only tracks *new* entries (we don't want a half-edited entry
  // to overwrite the next "새 영화 기록" session).
  const { initialDraft, clear } = useDraft(
    mode === 'new',
    () => (mode === 'new' ? draft : null),
  );

  // Offer to restore the previous draft once on mount.
  const [restorePromptVisible, setRestorePromptVisible] = useState(
    Boolean(mode === 'new' && initialDraft && initialDraft.title),
  );

  const acceptRestore = () => {
    if (initialDraft) setDraft({ ...initialDraft });
    setRestorePromptVisible(false);
  };
  const declineRestore = () => {
    clear();
    setRestorePromptVisible(false);
  };

  const dirty = useMemo(() => !draftsAreEqual(draft, baseline), [draft, baseline]);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // --- patch helpers ---
  const patch = useCallback(
    (changes: Partial<MovieDraft>) => setDraft((d) => ({ ...d, ...changes })),
    [],
  );

  // --- close / save handlers ---
  const closeModal = useCallback(() => {
    setSearchParams((sp) => {
      sp.delete('modal');
      sp.delete('id');
      return sp;
    });
  }, [setSearchParams]);

  const requestClose = useCallback(() => {
    if (dirtyRef.current) {
      const ok = window.confirm('작성 중인 내용이 있습니다. 닫으시겠어요?');
      if (!ok) return;
    }
    if (mode === 'new') clear();
    closeModal();
  }, [closeModal, mode, clear]);

  const handleSave = useCallback(() => {
    const title = draft.title.trim();
    if (!title) {
      window.alert('영화 제목을 입력해주세요.');
      return;
    }
    if (!draft.watched) {
      window.alert('본 날짜를 입력해주세요.');
      return;
    }

    const watchedISO = draft.watched.includes('T')
      ? draft.watched
      : `${draft.watched}T00:00:00`;

    const now = new Date().toISOString();

    if (mode === 'edit' && editTarget) {
      const patchPayload: Partial<MovieEntry> = {
        title,
        originalTitle: draft.originalTitle,
        tmdbId: draft.tmdbId,
        year: draft.year,
        runtime: draft.runtime,
        director: draft.director,
        posterPath: draft.posterPath,
        genres: draft.genres,
        watched: watchedISO,
        rating: draft.rating,
        note: draft.note,
        tags: draft.tags,
        liked: draft.liked,
      };
      dispatch({ type: 'updateEntry', payload: { id: editTarget.id, patch: patchPayload } });
      // Stay on the same detail page — strip params only.
      closeModal();
      return;
    }

    // mode === 'new'
    // Compute the rewatch index for the entryId based on existing matching titles.
    const rewatchCount =
      entries.filter((e) =>
        draft.tmdbId != null
          ? e.tmdbId === draft.tmdbId
          : e.title === title && e.originalTitle === draft.originalTitle,
      ).length + 1;
    const id = entryId(watchedISO, title, rewatchCount);
    const newEntry: MovieEntry = {
      id,
      tmdbId: draft.tmdbId,
      title,
      originalTitle: draft.originalTitle,
      year: draft.year,
      runtime: draft.runtime,
      director: draft.director,
      posterPath: draft.posterPath,
      genres: draft.genres,
      watched: watchedISO,
      rating: draft.rating,
      note: draft.note,
      tags: draft.tags,
      liked: draft.liked,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'addEntry', payload: newEntry });
    clear();
    // Land on the new detail page — strips ?modal=… too.
    navigate(`/entry/${encodeURIComponent(id)}`);
  }, [draft, editTarget, mode, dispatch, entries, navigate, closeModal, clear]);

  // --- effects: body scroll lock, key handlers ---
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
        return;
      }
      // ⌘Enter / Ctrl+Enter saves.
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [requestClose, handleSave]);

  // --- TMDB selection: pre-fill form fields, then fetch full details. ---
  const handleTmdbSelect = (hit: TmdbSearchResult) => {
    patch({
      tmdbId: hit.id,
      title: hit.title || hit.originalTitle,
      originalTitle: hit.originalTitle,
      year: hit.year,
      posterPath: hit.posterPath,
      genres: hit.genres,
    });
    if (settings.tmdbKey) {
      // Fire-and-forget detail fetch for runtime + director.
      getMovieDetails(hit.id, settings.tmdbKey)
        .then((details) => {
          patch({
            runtime: details.runtime || 0,
            director: details.director || '',
            // Prefer the localised genre names returned by the details endpoint.
            genres: details.genres.length > 0 ? details.genres : hit.genres,
          });
        })
        .catch((err) => {
          // Detail enrichment is optional — the user can still save.
          console.warn('[tmdb] getMovieDetails failed', err);
        });
    }
  };

  // --- render ---
  const noteLen = draft.note.length;
  const noteOver = noteLen > MAX_NOTE;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        animation: 'movie-modal-fade 0.18s ease',
      }}
    >
      <div
        onClick={requestClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(20, 24, 28, 0.78)',
          backdropFilter: 'blur(4px)',
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: '50%',
          top: 80,
          transform: 'translateX(-50%)',
          width: 'min(720px, calc(100vw - 24px))',
          background: 'var(--bg-2)',
          borderRadius: 8,
          border: '1px solid var(--rule-strong)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          maxHeight: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--rule)',
            flexShrink: 0,
          }}
        >
          <div>
            <div className="t-tiny" style={{ marginBottom: 4 }}>
              {mode === 'edit' ? 'EDIT ENTRY' : 'NEW ENTRY'}
            </div>
            <h2 id="movie-modal-title" className="t-h2" style={{ margin: 0 }}>
              {mode === 'edit' ? '기록 편집' : '새 영화 기록'}
            </h2>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={requestClose}
            aria-label="닫기"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {restorePromptVisible && initialDraft && (
            <div
              style={{
                marginBottom: 18,
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(98,210,111,0.10)',
                border: '1px solid var(--rule-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
              role="status"
            >
              <div style={{ fontSize: 13, color: 'var(--text)' }}>
                이어서 작성하시겠어요?{' '}
                <span style={{ color: 'var(--text-muted)' }}>
                  ({initialDraft.title || '제목 없음'})
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="btn-ghost" onClick={declineRestore}>
                  새로 시작
                </button>
                <button type="button" className="btn-primary" onClick={acceptRestore}>
                  이어서 작성
                </button>
              </div>
            </div>
          )}

          {/* Field 1 — Title with TMDB autocomplete */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <label
                htmlFor="movie-modal-title-input"
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}
              >
                영화 제목 <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {settings.tmdbKey ? 'TMDB에서 자동 검색' : '키 미설정 — 직접 입력'}
              </span>
            </div>
            <TmdbAutocomplete
              value={draft.title}
              onChange={(v) => patch({ title: v, tmdbId: null })}
              onSelect={handleTmdbSelect}
              tmdbKey={settings.tmdbKey}
              selectedTmdbId={draft.tmdbId}
            />
          </div>

          {/* Field 2/3 — date + rating */}
          <div
            style={{
              marginTop: 18,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 18,
            }}
          >
            <div>
              <label
                htmlFor="movie-modal-watched"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text)',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                본 날짜 <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input
                id="movie-modal-watched"
                className="input"
                type="date"
                value={draft.watched}
                onChange={(e) => patch({ watched: e.target.value })}
                style={{ fontSize: 14, fontWeight: 500 }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text)',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                별점 <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <div
                className="input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                }}
              >
                <StarInput
                  value={draft.rating}
                  onChange={(v) => patch({ rating: v })}
                  pixelSize={20}
                />
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
                  {draft.rating.toFixed(1)}{' '}
                  <span style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: 12 }}>
                    {' '}/ 5
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Field 4 — memo */}
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <label
                htmlFor="movie-modal-note"
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}
              >
                감상 메모
              </label>
              <span
                style={{
                  fontSize: 11,
                  color: noteOver ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {noteLen} / {MAX_NOTE}자
              </span>
            </div>
            <textarea
              id="movie-modal-note"
              className="input"
              value={draft.note}
              onChange={(e) => patch({ note: e.target.value })}
              placeholder="이 영화에 대해 남기고 싶은 말…"
              style={{
                minHeight: 140,
                fontSize: 14,
                lineHeight: 1.7,
                padding: '14px 16px',
              }}
            />
          </div>

          {/* Field 5 — tags */}
          <div style={{ marginTop: 18 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                display: 'block',
                marginBottom: 8,
              }}
            >
              태그
            </label>
            <TagInput
              value={draft.tags}
              onChange={(next) => patch({ tags: next })}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--rule)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.15)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.6" />
              <path d="M21 4v6h-6" />
            </svg>
            로컬 스토리지에 자동 저장 · ⌘Enter로 저장
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-ghost" onClick={requestClose}>
              취소
            </button>
            <button type="button" className="btn-primary" onClick={handleSave}>
              {mode === 'edit' ? '변경사항 저장' : '기록 저장'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes movie-modal-fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }`}</style>
    </div>
  );
}
