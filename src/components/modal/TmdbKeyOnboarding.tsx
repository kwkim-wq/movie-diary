// TmdbKeyOnboarding — decides whether to show the TmdbKeyPrompt.
//
// Triggers:
//   1) URL has ?modal=tmdb-key (manual open from autocomplete error etc.)
//   2) On first hydration, settings.tmdbKey === '' AND
//      no `VITE_TMDB_KEY` env var, AND the user has not already seen the
//      onboarding this session (sessionStorage flag — so closing once with
//      "건너뛰기" doesn't immediately re-open).
//
// We also offer an env-var escape hatch: when import.meta.env.VITE_TMDB_KEY
// is set we copy it into settings.tmdbKey on first run so power users don't
// need to paste.

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMovies } from '../../hooks/useMovies';
import { TmdbKeyPrompt } from './TmdbKeyPrompt';

const SESSION_FLAG = 'movieDiary.onboardingSeen';

export function TmdbKeyOnboarding() {
  const { settings, setSetting, hydrated } = useMovies();
  const [searchParams] = useSearchParams();
  const [autoOpen, setAutoOpen] = useState(false);
  const handledRef = useRef(false);

  const modalParam = searchParams.get('modal');
  const explicitOpen = modalParam === 'tmdb-key';

  useEffect(() => {
    if (!hydrated || handledRef.current) return;
    handledRef.current = true;

    // 1) Env var fast-path.
    const envKey = (import.meta.env.VITE_TMDB_KEY ?? '').toString().trim();
    if (envKey && !settings.tmdbKey) {
      setSetting('tmdbKey', envKey);
      return;
    }

    // 2) Otherwise show the prompt once per session if no key.
    const seen = window.sessionStorage.getItem(SESSION_FLAG) === '1';
    if (!seen && !settings.tmdbKey) {
      setAutoOpen(true);
    }
  }, [hydrated, settings.tmdbKey, setSetting]);

  const handleClose = () => {
    setAutoOpen(false);
    try {
      window.sessionStorage.setItem(SESSION_FLAG, '1');
    } catch {
      // sessionStorage can fail in private mode; harmless.
    }
  };

  return <TmdbKeyPrompt open={explicitOpen || autoOpen} onClose={handleClose} />;
}
