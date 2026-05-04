// TmdbKeyPrompt — first-run modal that explains how to grab a TMDB v3 key and
// stores it in settings. Renders when the URL is `?modal=tmdb-key` OR when the
// user has no key on first hydration (handled in TmdbKeyOnboarding).
//
// Spec: design-handoff/handoff.html §6 (TMDB API 키 입력 모달).

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMovies } from '../../hooks/useMovies';

interface TmdbKeyPromptProps {
  /** Whether to render. */
  open: boolean;
  /** Called after the user saves a key OR clicks "건너뛰기". */
  onClose: () => void;
}

export function TmdbKeyPrompt({ open, onClose }: TmdbKeyPromptProps) {
  const { settings, setSetting } = useMovies();
  const [, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState(settings.tmdbKey ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(settings.tmdbKey ?? '');
  }, [settings.tmdbKey, open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close (treats as "건너뛰기").
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Autofocus the input when the modal opens.
  useEffect(() => {
    if (open) {
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = draft.trim();
    setSetting('tmdbKey', trimmed);
    // Strip ?modal=tmdb-key but keep any other params.
    setSearchParams((sp) => {
      sp.delete('modal');
      return sp;
    });
    onClose();
  };

  const handleSkip = () => {
    setSearchParams((sp) => {
      sp.delete('modal');
      return sp;
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tmdb-key-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
      }}
    >
      <div
        onClick={handleSkip}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(20, 24, 28, 0.78)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 80,
          transform: 'translateX(-50%)',
          width: 'min(560px, calc(100vw - 24px))',
          background: 'var(--bg-2)',
          borderRadius: 8,
          border: '1px solid var(--rule-strong)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          animation: 'tmdb-fade-in 0.18s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--rule)',
          }}
        >
          <div className="t-tiny" style={{ marginBottom: 4 }}>
            FIRST RUN
          </div>
          <h2 id="tmdb-key-title" className="t-h2" style={{ margin: 0 }}>
            TMDB API 키 입력
          </h2>
        </div>

        <div style={{ padding: '24px 28px' }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.65,
              color: 'var(--text)',
            }}
          >
            영화 제목 자동완성과 포스터를 위해 무료 TMDB API 키가 필요합니다.{' '}
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'underline' }}
            >
              themoviedb.org
            </a>
            에서 무료 가입 후 [Settings → API → API Read Access Token (v3 auth)] 의 키를
            복사해 붙여넣어주세요.
          </p>
          <div style={{ marginTop: 18 }}>
            <label
              htmlFor="tmdb-key-input"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                display: 'block',
                marginBottom: 8,
              }}
            >
              API Key (v3)
            </label>
            <input
              id="tmdb-key-input"
              ref={inputRef}
              className="input"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              placeholder="예: a1b2c3d4e5f6…"
              style={{ fontFamily: 'Inter, monospace', fontSize: 13 }}
            />
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
              }}
            >
              키는 이 브라우저의 로컬 스토리지에만 저장됩니다. 외부 서버로 전송되지 않습니다.
              <br />
              건너뛰면 자동완성 없이 직접 입력 모드로 사용할 수 있습니다.
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--rule)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <button type="button" className="btn-ghost" onClick={handleSkip}>
            건너뛰기
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
      <style>{`@keyframes tmdb-fade-in {
        from { opacity: 0; transform: translate(-50%, -8px); }
        to   { opacity: 1; transform: translate(-50%, 0); }
      }`}</style>
    </div>
  );
}
