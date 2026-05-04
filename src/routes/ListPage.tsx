// ListPage — main list view. Reused under three filters:
//   filter="all"   → /
//   filter="year"  → /year/:year (year filter)
//   filter="liked" → /liked
//
// Layout follows design-handoff/scene-list.jsx (Phase 3 inline preview):
//   AppHeader → Hero stat bar → Filter bar → Grid → "더 불러오기" footer.

import { useDeferredValue, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader, type NavKey } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { MovieCard } from '../components/MovieCard';
import { Poster } from '../components/Poster';
import { Stars } from '../components/Stars';
import { useMovies } from '../hooks/useMovies';
import type { MovieEntry, SortKey, ViewMode } from '../types';

export type ListFilter = 'all' | 'year' | 'liked';

interface ListPageProps {
  filter: ListFilter;
}

const SORT_BUTTONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: '최신순' },
  { key: 'rating', label: '별점순' },
  { key: 'year', label: '연도순' },
  { key: 'title', label: '제목순' },
];

function StatBlock({ value, label }: { value: React.ReactNode; label: string }) {
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

function compareEntries(a: MovieEntry, b: MovieEntry, sort: SortKey): number {
  switch (sort) {
    case 'recent':
      // Most recent watch first.
      return (b.watched || '').localeCompare(a.watched || '');
    case 'rating':
      // Highest rating first; tie-break by recency so the order is stable.
      if (b.rating !== a.rating) return b.rating - a.rating;
      return (b.watched || '').localeCompare(a.watched || '');
    case 'year':
      // Newest release year first.
      if (b.year !== a.year) return b.year - a.year;
      return a.title.localeCompare(b.title, 'ko');
    case 'title':
      return a.title.localeCompare(b.title, 'ko');
    default:
      return 0;
  }
}

function applyFilter(
  entries: MovieEntry[],
  filter: ListFilter,
  yearParam: string | undefined,
): MovieEntry[] {
  switch (filter) {
    case 'year': {
      const year = (yearParam || '').slice(0, 4);
      if (!year) return entries;
      return entries.filter((e) => (e.watched || '').startsWith(year));
    }
    case 'liked':
      return entries.filter((e) => e.liked);
    case 'all':
    default:
      return entries;
  }
}

function applySearch(entries: MovieEntry[], q: string): MovieEntry[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter((e) => {
    const haystack = [
      e.title,
      e.originalTitle,
      e.director,
      e.note,
      ...(e.tags || []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}

function formatAvg(avg: number): string {
  if (Number.isNaN(avg)) return '—';
  // One decimal, no trailing zero stripping (4.0 reads cleaner than 4).
  return avg.toFixed(1);
}

export function ListPage({ filter }: ListPageProps) {
  const navigate = useNavigate();
  const params = useParams<{ year?: string }>();
  const { entries, settings, setSetting, hydrated } = useMovies();
  const [query, setQuery] = useState('');
  // useDeferredValue keeps typing snappy on big lists — the grid lags, the input doesn't.
  const deferredQuery = useDeferredValue(query);

  const sort = settings.sort;
  const view = settings.view;

  const headerTitle = useMemo(() => {
    if (filter === 'liked') return '좋아요한 영화';
    if (filter === 'year') return `${params.year ?? ''}년 본 영화`;
    return '최근 본 영화';
  }, [filter, params.year]);

  const headerSubtitle = useMemo(() => {
    if (filter === 'liked') return '하트로 표시한 작품';
    if (filter === 'year') return `${params.year ?? ''}년에 본 작품 · 시간순으로 정렬됨`;
    return '나의 영화 일기 · 시간순으로 정렬됨';
  }, [filter, params.year]);

  const headerKicker = useMemo(() => {
    if (filter === 'liked') return '내가 좋아한 영화';
    if (filter === 'year') return `연도 · ${params.year ?? ''}`;
    return '나의 영화 일기';
  }, [filter, params.year]);

  // Stats are *unconditional* — they always reflect the entire library, not the
  // currently-filtered slice. (Following the Phase 3 mockup intent.)
  const totalCount = entries.length;
  const thisYear = useMemo(() => {
    const y = String(new Date().getFullYear());
    return entries.filter((e) => (e.watched || '').startsWith(y)).length;
  }, [entries]);
  const avgRating = useMemo(() => {
    if (entries.length === 0) return Number.NaN;
    const sum = entries.reduce((s, e) => s + (e.rating || 0), 0);
    return sum / entries.length;
  }, [entries]);

  // Pipeline: filter route → search query → sort.
  const visible = useMemo(() => {
    const filtered = applyFilter(entries, filter, params.year);
    const searched = applySearch(filtered, deferredQuery);
    return [...searched].sort((a, b) => compareEntries(a, b, sort));
  }, [entries, filter, params.year, deferredQuery, sort]);

  const activeNav: NavKey = filter === 'year' ? 'year' : filter === 'liked' ? 'liked' : 'all';

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

  const openCreateModal = () => navigate({ search: '?modal=new' });

  // Hydration gate — never render the empty default state over real localStorage data.
  if (!hydrated) return null;

  // First-run empty state lives *outside* of any filter, so always check entries.length.
  if (entries.length === 0) {
    return (
      <div className="scene app-root" style={{ minHeight: '100vh' }}>
        <AppHeader
          showNav
          activeNav={activeNav}
          showSearch={false}
          onBrandClick={() => navigate('/')}
          onNavClick={handleNavClick}
          onCreate={openCreateModal}
        />
        <EmptyState onCta={openCreateModal} />
      </div>
    );
  }

  return (
    <div className="scene app-root" style={{ minHeight: '100vh' }}>
      <AppHeader
        showNav
        activeNav={activeNav}
        showSearch
        searchValue={query}
        onSearchChange={setQuery}
        onBrandClick={() => navigate('/')}
        onNavClick={handleNavClick}
        onCreate={openCreateModal}
      />

      {/* Hero stat bar */}
      <div
        className="page-pad hero-stack"
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
            {headerKicker}
          </div>
          <h1 className="t-h1 hero-title" style={{ margin: 0, fontSize: 36 }}>
            {headerTitle}
          </h1>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
            {headerSubtitle}
          </div>
        </div>
        <div className="hero-stats" style={{ display: 'flex', gap: 48, paddingBottom: 4, flexWrap: 'wrap' }}>
          <StatBlock value={totalCount} label="총 기록" />
          <StatBlock value={thisYear} label={`${new Date().getFullYear()}년`} />
          <StatBlock
            value={
              <span>
                {formatAvg(avgRating)}
                <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {' '}
                  / 5
                </span>
              </span>
            }
            label="평균 별점"
          />
        </div>
      </div>

      {/* Filter bar */}
      <div
        className="page-pad"
        style={{
          padding: '0 56px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--rule)',
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
                onClick={() => setSetting('sort', key)}
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {visible.length} / {entries.length}편 표시
          </div>
          <div style={{ width: 1, height: 18, background: 'var(--rule)' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              className="btn-icon"
              aria-label="그리드 보기"
              aria-pressed={view === 'grid'}
              onClick={() => setSetting('view', 'grid' as ViewMode)}
              style={
                view === 'grid'
                  ? { background: 'var(--bg-3)', color: 'var(--text)' }
                  : {}
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              type="button"
              className="btn-icon"
              aria-label="리스트 보기"
              aria-pressed={view === 'list'}
              onClick={() => setSetting('view', 'list' as ViewMode)}
              style={
                view === 'list'
                  ? { background: 'var(--bg-3)', color: 'var(--text)' }
                  : {}
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Grid / list body */}
      <div className="page-pad" style={{ padding: '36px 56px 60px' }}>
        {visible.length === 0 ? (
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
        ) : view === 'grid' ? (
          <div className="movie-grid">
            {visible.map((entry) => (
              <MovieCard
                key={entry.id}
                entry={entry}
                onClick={() => navigate(`/entry/${encodeURIComponent(entry.id)}`)}
              />
            ))}
          </div>
        ) : (
          <ListBody entries={visible} onSelect={(id) => navigate(`/entry/${encodeURIComponent(id)}`)} />
        )}
      </div>
    </div>
  );
}

/* ─── Compact list view ─────────────────────────────────────────── */
// Phase 4 ships a minimal list view so the "그리드/리스트" toggle has visible
// payoff. Phase 6 (responsive/polish) can revisit the layout.

function ListBody({
  entries,
  onSelect,
}: {
  entries: MovieEntry[];
  onSelect: (id: string) => void;
}) {
  const fmt = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {entries.map((entry) => (
        <div
          key={entry.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(entry.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(entry.id);
            }
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 100px 110px',
            alignItems: 'center',
            gap: 18,
            padding: '14px 0',
            borderTop: '1px solid var(--rule)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 40,
                aspectRatio: '2/3',
                borderRadius: 3,
                overflow: 'hidden',
                flexShrink: 0,
                background: 'var(--bg-2)',
              }}
            >
              <Poster
                posterPath={entry.posterPath}
                posterKind={entry.posterKind}
                title={entry.title}
                size="card"
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {entry.title}{' '}
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>
                  · {entry.originalTitle}
                </span>
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                {entry.year} · {entry.director}
              </div>
            </div>
          </div>
          <Stars rating={entry.rating} pixelSize={13} gap={1} />
          <div style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'right' }}>
            {entry.runtime ? `${Math.floor(entry.runtime / 60)}시간 ${entry.runtime % 60}분` : ''}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              fontWeight: 500,
              textAlign: 'right',
            }}
          >
            {fmt.format(new Date(entry.watched))}
          </div>
        </div>
      ))}
    </div>
  );
}
