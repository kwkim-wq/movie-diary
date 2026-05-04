// ActorsPage — /actors. Aggregated grid of every cast member that's appeared
// in any of the user's recorded movies. Provides three views (most-seen,
// liked-only, alphabetical) plus a 200ms-debounced name search.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader, type NavKey } from '../components/AppHeader';
import { CastCard } from '../components/CastCard';
import { useDebounce } from '../hooks/useDebounce';
import { useMovies } from '../hooks/useMovies';
import type { ActorSummary } from '../types';

type ActorSort = 'count' | 'liked' | 'name';

const SORT_BUTTONS: { key: ActorSort; label: string }[] = [
  { key: 'count', label: '등장순' },
  { key: 'liked', label: '좋아한 배우만' },
  { key: 'name', label: '가나다순' },
];

function compareActors(a: ActorSummary, b: ActorSummary, sort: ActorSort): number {
  switch (sort) {
    case 'count':
      // Most-seen first; tie-break by liked then by name.
      if (b.movieCount !== a.movieCount) return b.movieCount - a.movieCount;
      if (Number(b.likedInAny) !== Number(a.likedInAny)) {
        return Number(b.likedInAny) - Number(a.likedInAny);
      }
      return a.name.localeCompare(b.name, 'ko');
    case 'liked':
      // 'liked' is rendered as a *filter* below — leave the order
      // count-descending so the user still sees their most-watched darlings first.
      if (b.movieCount !== a.movieCount) return b.movieCount - a.movieCount;
      return a.name.localeCompare(b.name, 'ko');
    case 'name':
      return a.name.localeCompare(b.name, 'ko');
    default:
      return 0;
  }
}

export function ActorsPage() {
  const navigate = useNavigate();
  const { entries, hydrated, getAllActors } = useMovies();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const [sort, setSort] = useState<ActorSort>('count');

  const allActors = useMemo<ActorSummary[]>(() => getAllActors(), [getAllActors]);
  const totalActors = allActors.length;
  const likedCount = useMemo(
    () => allActors.filter((a) => a.likedInAny).length,
    [allActors],
  );

  const visible = useMemo(() => {
    let pool = allActors;
    // 'liked' button doubles as a filter — keeps the toggle row simple.
    if (sort === 'liked') pool = pool.filter((a) => a.likedInAny);
    const needle = debouncedQuery.trim().toLowerCase();
    if (needle) pool = pool.filter((a) => a.name.toLowerCase().includes(needle));
    return [...pool].sort((a, b) => compareActors(a, b, sort));
  }, [allActors, sort, debouncedQuery]);

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

  if (!hydrated) return null;

  // Empty state — either no entries at all, or entries without any cast.
  const isEmpty = entries.length === 0 || allActors.length === 0;

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

      {/* Hero */}
      <div
        style={{
          padding: '40px 56px 28px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 32,
        }}
      >
        <div>
          <div className="t-tiny" style={{ marginBottom: 10 }}>
            CAST INDEX
          </div>
          <h1 className="t-h1" style={{ margin: 0, fontSize: 36 }}>
            배우
          </h1>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
            영화에 출연한 배우들 · 좋았던 배우는 ❤로 기억해두세요
          </div>
        </div>
        <div style={{ display: 'flex', gap: 48, paddingBottom: 4 }}>
          <Stat value={totalActors} label="총 배우" />
          <Stat value={likedCount} label="좋아한 배우" />
        </div>
      </div>

      {/* Toolbar — sort buttons + search */}
      <div
        style={{
          padding: '0 56px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          borderBottom: '1px solid var(--rule)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }} role="radiogroup" aria-label="정렬">
          {SORT_BUTTONS.map(({ key, label }) => {
            const active = sort === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                className="btn-ghost"
                onClick={() => setSort(key)}
                style={
                  active
                    ? { background: 'var(--bg-3)', borderColor: 'var(--bg-hover)' }
                    : {}
                }
              >
                {label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', width: 220 }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="2"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              className="input"
              placeholder="배우 이름 검색…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="배우 검색"
              style={{
                paddingLeft: 34,
                fontSize: 13,
                padding: '8px 14px 8px 34px',
                background: 'var(--bg-2)',
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {visible.length} / {totalActors}명
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '36px 56px 60px' }}>
        {isEmpty ? (
          <ActorsEmpty onCta={() => navigate({ search: '?modal=new' })} />
        ) : visible.length === 0 ? (
          <div
            style={{
              padding: '60px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            검색 결과가 없습니다.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 18,
            }}
          >
            {visible.map((a) => (
              <CastCard
                key={a.id}
                id={a.id}
                name={a.name}
                subtitle={`${a.movieCount}편 출연${
                  Number.isFinite(a.averageRating) && a.movieCount > 0
                    ? ` · ★ ${a.averageRating.toFixed(1)}`
                    : ''
                }`}
                profilePath={a.profilePath}
                liked={a.likedInAny}
                showHeart
                // No onToggleLike — the actors index aggregates state across many
                // entries; toggling happens on a specific MovieEntry.
                onClick={() => navigate(`/actor/${a.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text)',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
      <div className="t-tiny" style={{ whiteSpace: 'nowrap' }}>
        {label}
      </div>
    </div>
  );
}

function ActorsEmpty({ onCta }: { onCta: () => void }) {
  return (
    <div
      style={{
        padding: '80px 0 120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: 'var(--radius)',
          background: 'var(--bg-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--rule-strong)',
        }}
        aria-hidden="true"
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </div>
      <div style={{ maxWidth: 420 }}>
        <h2 className="t-h2" style={{ margin: 0, color: 'var(--text)' }}>
          아직 기록한 배우가 없습니다
        </h2>
        <div
          style={{
            marginTop: 10,
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--text-muted)',
          }}
        >
          영화를 기록하면 출연 배우가 자동으로 모입니다. 좋았던 배우에게 ❤를 남겨두면
          이 페이지에서 한눈에 찾을 수 있어요.
        </div>
      </div>
      <button
        type="button"
        className="btn-primary"
        onClick={onCta}
        style={{ padding: '12px 22px', fontSize: 14 }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        영화 기록하러 가기
      </button>
    </div>
  );
}
