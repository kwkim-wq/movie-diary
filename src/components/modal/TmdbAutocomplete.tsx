// TmdbAutocomplete — title input + dropdown of TMDB hits.
// Spec: design-handoff/handoff.html §4.4 + scene-modal.jsx (lines 51–83).
//
// Behaviour:
//   - 250ms debounce inside useTmdbSearch.
//   - Keyboard: ↑/↓ moves selection, Enter confirms, Esc closes.
//   - Selected hit row gets the accent-soft background and a "선택됨" label.
//   - When TMDB key is missing we surface a helpful message + link to the
//     onboarding modal (?modal=tmdb-key).
//   - Empty results → final row "검색 결과 없음 — 직접 입력하기" that fires the
//     `onManualInput` callback so the user keeps typing without selecting.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTmdbSearch } from '../../hooks/useTmdbSearch';
import { posterUrl } from '../../lib/tmdb';
import { TmdbAuthError, type TmdbSearchResult } from '../../types';

interface TmdbAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (hit: TmdbSearchResult) => void;
  /** TMDB API key. Empty string disables network calls. */
  tmdbKey: string;
  /** Optional manual-input fallback (when TMDB returns nothing). */
  onManualInput?: () => void;
  /** External signal that the parent has applied a selection — closes the dropdown. */
  selectedTmdbId?: number | null;
}

export function TmdbAutocomplete({
  value,
  onChange,
  onSelect,
  tmdbKey,
  onManualInput,
  selectedTmdbId,
}: TmdbAutocompleteProps) {
  const navigate = useNavigate();
  const { results, loading, error } = useTmdbSearch(value, tmdbKey);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset highlight whenever the result set changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [results.length, value]);

  // Close the dropdown right after a selection commits.
  useEffect(() => {
    if (selectedTmdbId != null) setOpen(false);
  }, [selectedTmdbId]);

  const showDropdown = open && value.trim() !== '';
  const hasAuthError = error instanceof TmdbAuthError;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (results[activeIndex]) {
        e.preventDefault();
        onSelect(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9CA3AF"
        strokeWidth="2"
        style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
        }}
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={inputRef}
        className="input"
        type="text"
        autoFocus
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Re-open dropdown only on actual user typing — programmatic value
          // changes (after a hit is selected) must not re-open it.
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        placeholder="영화 제목 검색…"
        aria-label="영화 제목"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        style={{
          paddingLeft: 38,
          fontSize: 15,
          fontWeight: 500,
          borderColor: value.trim() ? 'var(--accent)' : undefined,
        }}
      />

      {/* Right-side state badge */}
      {value.trim() && (
        <div
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: loading ? 'var(--accent)' : 'var(--text-muted)',
            pointerEvents: 'none',
          }}
          aria-live="polite"
        >
          {loading ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'tmdb-pulse 1.4s infinite',
                }}
              />
              검색 중
            </>
          ) : null}
        </div>
      )}

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--bg-3)',
            border: '1px solid var(--rule-strong)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            zIndex: 5,
            overflow: 'hidden',
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {hasAuthError ? (
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
                TMDB API 키가 설정되지 않았습니다.
              </div>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: 12, padding: '6px 10px' }}
                onClick={() =>
                  navigate({ search: '?modal=tmdb-key' })
                }
              >
                키 설정하기
              </button>
            </div>
          ) : error ? (
            <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
              {error.message || '검색 중 오류가 발생했습니다.'}
            </div>
          ) : results.length === 0 && !loading ? (
            <div style={{ padding: '10px 14px' }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                검색 결과 없음
              </div>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: 12, padding: '6px 10px' }}
                onClick={() => {
                  setOpen(false);
                  onManualInput?.();
                }}
              >
                직접 입력하기
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--rule)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}
                >
                  검색 결과 {results.length}건
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  ↑↓ 선택 · ⏎ 확정
                </span>
              </div>
              {results.map((s, i) => {
                const url = posterUrl(s.posterPath, 'w92');
                return (
                  <div
                    key={s.id}
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={(e) => {
                      // mousedown so the click registers before the input loses focus.
                      e.preventDefault();
                      onSelect(s);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      background:
                        i === activeIndex ? 'rgba(98, 210, 111, 0.10)' : 'transparent',
                      cursor: 'pointer',
                      borderBottom:
                        i < results.length - 1 ? '1px solid var(--rule)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 56,
                        borderRadius: 3,
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: 'var(--bg-2)',
                      }}
                    >
                      {url ? (
                        <img
                          src={url}
                          alt=""
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            color: 'var(--text-faint)',
                            letterSpacing: '0.1em',
                            fontWeight: 500,
                            textAlign: 'center',
                            padding: 4,
                          }}
                        >
                          NO POSTER
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                        {s.title || s.originalTitle}
                        {s.originalTitle && s.originalTitle !== s.title && (
                          <span
                            style={{
                              fontWeight: 400,
                              color: 'var(--text-muted)',
                              fontStyle: 'italic',
                              fontSize: 12,
                            }}
                          >
                            {' '}
                            · {s.originalTitle}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                        {s.year || '연도 미상'}
                        {s.genres.length > 0 && ` · ${s.genres.slice(0, 2).join(' · ')}`}
                      </div>
                    </div>
                    {i === activeIndex && (
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          color: 'var(--accent)',
                          textTransform: 'uppercase',
                        }}
                      >
                        선택됨
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
      <style>{`@keyframes tmdb-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }`}</style>
    </div>
  );
}
