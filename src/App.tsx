// Phase 3: temporary inline ListPage so the user can visually verify the
// migrated components against design-handoff/preview.html. Phase 4 will turn
// this into a real route + state-driven view (Movies from context, sort/filter,
// active nav from URL).

import { AppHeader } from './components/AppHeader';
import { MovieCard } from './components/MovieCard';
import { SAMPLE_MOVIES } from './data/sampleMovies';
import { MoviesProvider } from './store/MoviesContext';

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

function TempListPage() {
  // Phase 3 uses sample data only. Phase 4 swaps this for `useMovies().entries`.
  const movies = SAMPLE_MOVIES;
  const totalCount = 137;
  const thisYear = 42;
  const avgRating = 4.1;

  return (
    <div className="scene app-root" style={{ minHeight: 1640 }}>
      <AppHeader showNav showSearch activeNav="all" />

      {/* Hero stat bar */}
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
            나의 영화 일기
          </div>
          <h1 className="t-h1" style={{ margin: 0, fontSize: 36 }}>
            최근 본 영화
          </h1>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
            2026년에 본 작품 · 시간순으로 정렬됨
          </div>
        </div>
        <div style={{ display: 'flex', gap: 48, paddingBottom: 4 }}>
          <StatBlock value={totalCount} label="총 기록" />
          <StatBlock value={thisYear} label="2026년" />
          <StatBlock
            value={
              <span>
                {avgRating}
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
        style={{
          padding: '0 56px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {['최신순', '별점순', '연도순', '제목순'].map((t, i) => (
            <button
              key={t}
              type="button"
              className="btn-ghost"
              style={
                i === 0 ? { background: 'var(--bg-3)', borderColor: 'var(--bg-hover)' } : {}
              }
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {movies.length} / {totalCount}편 표시
          </div>
          <div style={{ width: 1, height: 18, background: 'var(--rule)' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              className="btn-icon"
              aria-label="그리드 보기"
              style={{ background: 'var(--bg-3)', color: 'var(--text)' }}
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
            <button type="button" className="btn-icon" aria-label="리스트 보기">
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

      {/* Grid */}
      <div style={{ padding: '36px 56px 60px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '32px 24px',
          }}
        >
          {movies.map((entry, i) => (
            <MovieCard key={entry.id} entry={entry} forceHover={i === 0} />
          ))}
        </div>

        <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center' }}>
          <button type="button" className="btn-ghost" style={{ padding: '12px 28px' }}>
            더 불러오기
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <MoviesProvider>
      <TempListPage />
    </MoviesProvider>
  );
}

export default App;
