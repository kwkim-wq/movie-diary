// ActorDetailPage — /actor/:id. Shows one actor's library footprint:
//   • headshot + name + meta bar (movies seen, average rating, hearts)
//   • grid of MovieCards for every entry that mentions them
//
// "Not in your library" → render the NotFoundPage (consistent with how
// DetailPage handles a stray /entry/:bad-id).

import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader, type NavKey } from '../components/AppHeader';
import { MovieCard } from '../components/MovieCard';
import { useMovies } from '../hooks/useMovies';
import { profileUrl } from '../lib/tmdb';
import { NotFoundPage } from './NotFoundPage';

function initialsFor(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';
  if (/[가-힯]/.test(trimmed)) return trimmed.slice(0, 2);
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function ActorDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const { hydrated, getCastById } = useMovies();

  // Always run hooks unconditionally — only branch *after* the bundle resolves.
  const actorId = useMemo(() => Number(params.id ?? ''), [params.id]);
  const bundle = useMemo(() => {
    if (!hydrated || !Number.isFinite(actorId)) return null;
    return getCastById(actorId);
  }, [hydrated, actorId, getCastById]);

  const sortedMovies = useMemo(() => {
    if (!bundle) return [];
    return [...bundle.movies].sort((a, b) =>
      (b.watched || '').localeCompare(a.watched || ''),
    );
  }, [bundle]);

  // Average rating across the entries this actor appears in (NaN → "—").
  const averageRating = useMemo(() => {
    if (!bundle) return Number.NaN;
    const rated = bundle.movies.filter((m) => m.rating > 0);
    if (rated.length === 0) return Number.NaN;
    return rated.reduce((s, m) => s + m.rating, 0) / rated.length;
  }, [bundle]);

  // Total hearts the user has given this actor across all entries.
  const heartCount = useMemo(() => {
    if (!bundle) return 0;
    return bundle.movies.reduce(
      (n, m) => n + (m.cast || []).filter((c) => c.id === actorId && c.liked).length,
      0,
    );
  }, [bundle, actorId]);

  if (!hydrated) return null;
  if (!bundle) return <NotFoundPage />;

  const { actor } = bundle;
  const url = profileUrl(actor.profilePath, 'w342');

  const handleNavClick = (key: NavKey) => {
    switch (key) {
      case 'all':
        navigate('/');
        break;
      case 'year':
        navigate('/year/2026');
        break;
      case 'liked':
        navigate('/liked');
        break;
      case 'lists':
        navigate('/lists');
        break;
      case 'actors':
        navigate('/actors');
        break;
      case 'stats':
        navigate('/stats');
        break;
    }
  };

  return (
    <div className="scene app-root" style={{ minHeight: '100vh' }}>
      <AppHeader
        showNav
        activeNav="actors"
        showSearch={false}
        onBrandClick={() => navigate('/')}
        onNavClick={handleNavClick}
        onCreate={() => navigate({ search: '?modal=new' })}
      />

      {/* Breadcrumb */}
      <div className="page-pad" style={{ padding: '20px 56px 0' }}>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/actors')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/actors');
              }
            }}
          >
            ← 배우 목록으로
          </span>
          <span style={{ color: 'var(--text-faint)' }}>/</span>
          <span style={{ color: 'var(--text)' }}>{actor.name}</span>
        </div>
      </div>

      {/* Hero: headshot + meta */}
      <div
        className="actor-hero page-pad"
        style={{
          padding: '32px 56px 36px',
        }}
      >
        <div
          className="actor-headshot"
          style={{
            aspectRatio: '2/3',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            background: 'var(--bg-2)',
            boxShadow: 'var(--shadow-card)',
            outline: '1px solid rgba(255,255,255,0.06)',
            outlineOffset: -1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 56,
            fontWeight: 700,
          }}
          aria-hidden={url ? 'true' : undefined}
        >
          {url ? (
            <img
              src={url}
              alt={actor.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <span>{initialsFor(actor.name)}</span>
          )}
        </div>

        <div>
          <div className="t-tiny" style={{ marginBottom: 12 }}>
            CAST DETAIL
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            {actor.name}
          </h1>
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 14,
              fontSize: 14,
              color: 'var(--text-muted)',
            }}
          >
            <span>본 영화 {bundle.movies.length}편</span>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <span>
              평균 별점{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {Number.isFinite(averageRating) ? averageRating.toFixed(1) : '—'}
              </span>
            </span>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: heartCount > 0 ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill={heartCount > 0 ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 21s-7-4.5-7-10.5a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 10.5C19 16.5 12 21 12 21z" />
              </svg>
              {heartCount}번
            </span>
          </div>

          {/* Quick character list — small chips, max 6 unique characters. */}
          {(() => {
            const chars = Array.from(
              new Set(
                bundle.movies
                  .flatMap((m) =>
                    (m.cast || [])
                      .filter((c) => c.id === actorId)
                      .map((c) => c.character),
                  )
                  .filter(Boolean),
              ),
            ).slice(0, 6);
            if (chars.length === 0) return null;
            return (
              <div
                style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}
              >
                {chars.map((c) => (
                  <span
                    key={c}
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      border: '1px solid var(--rule-strong)',
                      padding: '3px 9px',
                      borderRadius: 999,
                    }}
                  >
                    as {c}
                  </span>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Filmography */}
      <div className="page-pad" style={{ padding: '0 56px 60px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 14,
            marginBottom: 24,
            borderBottom: '1px solid var(--rule)',
          }}
        >
          <h2 className="t-h2" style={{ margin: 0 }}>
            출연한 영화
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {sortedMovies.length}편 · 최근 감상순
          </div>
        </div>

        <div className="movie-grid">
          {sortedMovies.map((entry) => (
            <MovieCard
              key={entry.id}
              entry={entry}
              onClick={() => navigate(`/entry/${encodeURIComponent(entry.id)}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
