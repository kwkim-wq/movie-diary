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
import { getMovieCredits, getMovieDetails, getTvCredits, getTvDetails } from '../../lib/tmdb';
import type { CastMember, MovieDraft, MovieEntry, TmdbMultiResult } from '../../types';
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
    mediaType: 'movie',
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
    cast: [],
    creators: [],
    seasonCount: undefined,
    episodeCount: undefined,
    savedAt: '',
  };
}

function entryToDraft(e: MovieEntry): MovieDraft {
  return {
    title: e.title,
    originalTitle: e.originalTitle,
    tmdbId: e.tmdbId,
    mediaType: e.mediaType ?? 'movie',
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
    cast: Array.isArray(e.cast) ? e.cast : [],
    creators: e.creators ?? [],
    seasonCount: e.seasonCount,
    episodeCount: e.episodeCount,
    savedAt: '',
  };
}

/**
 * Merge a freshly-fetched cast list with whatever the entry already had — we
 * never want to clobber the user's per-actor heart toggles when they re-edit
 * an entry, even if TMDB returned a slightly different roster.
 */
function mergeCastLiked(next: CastMember[], previous: CastMember[]): CastMember[] {
  if (!previous || previous.length === 0) return next;
  const likedIds = new Set(previous.filter((c) => c.liked).map((c) => c.id));
  return next.map((c) => (likedIds.has(c.id) ? { ...c, liked: true } : c));
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
  // Cast is "dirty" if the actor set OR any heart flag differs.
  const aCast = (a.cast || []).map((c) => `${c.id}:${c.liked ? 1 : 0}`).join('|');
  const bCast = (b.cast || []).map((c) => `${c.id}:${c.liked ? 1 : 0}`).join('|');
  if (aCast !== bCast) return false;
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
        mediaType: draft.mediaType ?? 'movie',
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
        // Preserve any per-actor likes the user already toggled on the detail
        // page: re-merge the existing cast's liked flags into whatever cast we
        // have in the draft (keyed by TMDB person id).
        cast: mergeCastLiked(draft.cast, editTarget.cast),
        creators: draft.creators,
        seasonCount: draft.seasonCount,
        episodeCount: draft.episodeCount,
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
      mediaType: draft.mediaType ?? 'movie',
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
      cast: draft.cast,
      creators: draft.creators,
      seasonCount: draft.seasonCount,
      episodeCount: draft.episodeCount,
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
  const handleTmdbSelect = (hit: TmdbMultiResult) => {
    patch({
      tmdbId: hit.id,
      mediaType: hit.mediaType,
      title: hit.title || hit.originalTitle,
      originalTitle: hit.originalTitle,
      year: hit.year,
      posterPath: hit.posterPath,
      genres: hit.genres,
      // Reset cast on any new pick — the credits fetch below repopulates.
      cast: [],
      creators: [],
      seasonCount: undefined,
      episodeCount: undefined,
    });
    if (settings.tmdbKey) {
      if (hit.mediaType === 'tv') {
        // TV: fetch details + aggregate_credits
        getTvDetails(hit.id, settings.tmdbKey)
          .then((details) => {
            patch({
              runtime: details.runtime || 0,
              director: details.creators.join(', '),
              creators: details.creators,
              genres: details.genres.length > 0 ? details.genres : hit.genres,
              seasonCount: details.seasonCount,
              episodeCount: details.episodeCount,
            });
          })
          .catch((err) => {
            console.warn('[tmdb] getTvDetails failed', err);
          });
        getTvCredits(hit.id, settings.tmdbKey, { topN: 8 })
          .then((cast) => {
            const prefilled: CastMember[] = cast.map((c) => ({
              id: c.id,
              name: c.name,
              character: c.character,
              profilePath: c.profilePath,
              liked: false,
            }));
            setDraft((d) => ({
              ...d,
              cast: mergeCastLiked(prefilled, d.cast),
            }));
          })
          .catch((err) => {
            console.warn('[tmdb] getTvCredits failed', err);
          });
      } else {
        // Movie: fetch details + credits
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
        // Cast prefill — silent on failure so the modal never breaks the save flow.
        getMovieCredits(hit.id, settings.tmdbKey, { topN: 8 })
          .then(({ cast }) => {
            const prefilled: CastMember[] = cast.map((c) => ({
              id: c.id,
              name: c.name,
              character: c.character,
              profilePath: c.profilePath,
              liked: false,
            }));
            // Merge with whatever the user already had in this draft (edit mode)
            // so we don't clobber per-actor hearts on re-pick of the same movie.
            setDraft((d) => ({
              ...d,
              cast: mergeCastLiked(prefilled, d.cast),
            }));
          })
          .catch((err) => {
            console.warn('[tmdb] getMovieCredits failed', err);
          });
      }
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
        className="movie-modal"
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
          maxHeight: 'calc(100dvh - 120px)',
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

          {/* Field 2 — date */}
          <div style={{ marginTop: 18 }}>
            <label
              htmlFor="movie-modal-watched"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}
            >
              본 날짜 <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <div style={{ width: '100%', overflow: 'hidden' }}>
              <input
                id="movie-modal-watched"
                className="input"
                type="date"
                value={draft.watched}
                onChange={(e) => patch({ watched: e.target.value })}
                style={{ fontSize: 14, fontWeight: 500, WebkitAppearance: 'none', appearance: 'none' }}
              />
            </div>
          </div>

          {/* Field 3 — rating */}
          <div style={{ marginTop: 14 }}>
            <label
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}
            >
              별점 <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'var(--bg-3)',
                border: '1px solid var(--rule-strong)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <StarInput value={draft.rating} onChange={(v) => patch({ rating: v })} pixelSize={20} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                {draft.rating.toFixed(1)}
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-faint)' }}> / 5</span>
              </span>
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
            className="modal-footer-hint"
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
