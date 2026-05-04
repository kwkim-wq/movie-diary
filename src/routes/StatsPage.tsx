// StatsPage — /stats. A read-only dashboard summarising the user's library.
//
// All chart rendering is plain SVG (no external chart lib). Data comes from
// pure helpers in lib/stats.ts; this file is purely presentational so that
// adding/swapping cards stays cheap.
//
// Layout:
//   AppHeader → hero strip (4 totals) → 6-card grid
// The grid is 2 columns on desktop, 1 column on phones (.stats-grid). The
// monthly card spans the full row at every breakpoint to give the 12-bar
// chart enough width to breathe.

import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader, type NavKey } from '../components/AppHeader';
import { useMovies } from '../hooks/useMovies';
import {
  getDecadeCounts,
  getMonthlyCounts,
  getRatingHistogram,
  getTopDirectors,
  getTopGenres,
  getTotals,
  type CountedItem,
  type MonthlyCount,
  type RatingBucket,
} from '../lib/stats';

export function StatsPage() {
  const navigate = useNavigate();
  const { entries, hydrated } = useMovies();

  const totals = useMemo(() => getTotals(entries), [entries]);
  const monthly = useMemo(() => getMonthlyCounts(entries), [entries]);
  const ratings = useMemo(() => getRatingHistogram(entries), [entries]);
  const genres = useMemo(() => getTopGenres(entries, 5), [entries]);
  const directors = useMemo(() => getTopDirectors(entries, 5), [entries]);
  const decades = useMemo(() => getDecadeCounts(entries), [entries]);

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

  // Hydration gate — same pattern as the other routes; never render the empty
  // default state over real localStorage data on the first paint.
  if (!hydrated) return null;

  const isEmpty = entries.length === 0;

  return (
    <div className="scene app-root" style={{ minHeight: '100vh' }}>
      <AppHeader
        showNav
        activeNav="stats"
        showSearch={false}
        onBrandClick={() => navigate('/')}
        onNavClick={handleNavClick}
        onCreate={() => navigate({ search: '?modal=new' })}
      />

      {/* Hero */}
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
            DIARY STATS
          </div>
          <h1 className="t-h1 hero-title" style={{ margin: 0, fontSize: 36 }}>
            나의 영화 통계
          </h1>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
            기록한 모든 영화로 만든 작은 대시보드
          </div>
        </div>
        {!isEmpty && (
          <div className="hero-stats" style={{ display: 'flex', gap: 48, paddingBottom: 4, flexWrap: 'wrap' }}>
            <HeroStat value={totals.count} label="총 영화" />
            <HeroStat value={formatRuntime(totals.totalRuntime)} label="총 시청 시간" />
            <HeroStat
              value={
                <span>
                  {totals.avgRating > 0 ? totals.avgRating.toFixed(1) : '—'}
                  <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}>
                    {' '}/ 5
                  </span>
                </span>
              }
              label="평균 별점"
            />
            <HeroStat value={totals.likedCount} label="좋아한 영화" />
          </div>
        )}
      </div>

      <div className="divider" />

      {/* Body */}
      <div className="page-pad" style={{ padding: '36px 56px 60px' }}>
        {isEmpty ? (
          <StatsEmpty onCta={() => navigate({ search: '?modal=new' })} />
        ) : (
          <div className="stats-grid">
            <StatCard
              title="월별 시청"
              subtitle="최근 12개월"
              fullWidth
            >
              <MonthlyChart data={monthly} />
            </StatCard>
            <StatCard title="별점 분포" subtitle="0.5 ~ 5점 (0.5점 단위)">
              <RatingHistogram data={ratings} />
            </StatCard>
            <StatCard title="장르 분포" subtitle="가장 많이 본 장르 Top 5">
              <HorizontalBars data={genres} emptyLabel="장르 정보 없음" />
            </StatCard>
            <StatCard title="가장 많이 본 감독" subtitle="Top 5">
              <DirectorRanking data={directors} />
            </StatCard>
            <StatCard title="개봉 연대 분포" subtitle="기록한 영화의 제작 연대">
              <HorizontalBars
                data={decades.map((d) => ({ name: d.label, count: d.count }))}
                emptyLabel="연도 정보 없음"
              />
            </StatCard>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Hero stat block ─────────────────────────────────────────────── */

function HeroStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
      <div
        className="hero-stat-value"
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

/** Format minutes as "Xh Ym" or "Ym" — used by the runtime hero stat. */
function formatRuntime(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0분';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/* ─── Generic card frame ──────────────────────────────────────────── */

interface StatCardProps {
  title: string;
  subtitle?: string;
  /** When true, the card takes the full grid row (used for the monthly chart). */
  fullWidth?: boolean;
  children: ReactNode;
}

function StatCard({ title, subtitle, fullWidth, children }: StatCardProps) {
  return (
    <section
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        borderRadius: 6,
        padding: 24,
        gridColumn: fullWidth ? '1 / -1' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.005em' }}>
          {title}
        </h2>
        {subtitle && (
          <div className="t-tiny" style={{ letterSpacing: '0.02em' }}>{subtitle}</div>
        )}
      </header>
      <div>{children}</div>
    </section>
  );
}

/* ─── Monthly chart (vertical bars) ───────────────────────────────── */

function MonthlyChart({ data }: { data: MonthlyCount[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  // 12 bars across a 480 viewBox: 40px slot per bar, 28px bar, 6px padding.
  const slotWidth = 40;
  const barWidth = 28;
  const chartHeight = 140;
  const baselineY = 150;
  const totalWidth = data.length * slotWidth + 16; // small left/right padding
  const totalCount = data.reduce((s, d) => s + d.count, 0);

  if (totalCount === 0) {
    return (
      <ChartEmpty>최근 12개월 동안 기록된 영화가 없어요.</ChartEmpty>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 180`}
      style={{
        width: '100%',
        maxWidth: 640,
        height: 'auto',
        display: 'block',
        margin: '0 auto',
      }}
      role="img"
      aria-label="최근 12개월 월별 시청 편수"
    >
      {/* Baseline */}
      <line x1={8} x2={totalWidth - 8} y1={baselineY} y2={baselineY} stroke="var(--rule)" strokeWidth={1} />
      {data.map((m, i) => {
        const h = (m.count / max) * chartHeight;
        const x = i * slotWidth + 8;
        const y = baselineY - h;
        return (
          <g key={m.ym}>
            <rect
              x={x + (slotWidth - barWidth) / 2}
              y={y}
              width={barWidth}
              height={h}
              fill={m.count > 0 ? 'var(--accent)' : 'var(--bg-3)'}
              rx={2}
            >
              <title>{`${m.label}: ${m.count}편`}</title>
            </rect>
            {m.count > 0 && (
              <text
                x={x + slotWidth / 2}
                y={Math.max(y - 6, 12)}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {m.count}
              </text>
            )}
            <text
              x={x + slotWidth / 2}
              y={baselineY + 16}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-muted)"
            >
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Rating histogram ────────────────────────────────────────────── */

function RatingHistogram({ data }: { data: RatingBucket[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  const slotWidth = 38;
  const barWidth = 26;
  const chartHeight = 110;
  const baselineY = 120;
  const totalWidth = data.length * slotWidth + 16;

  if (total === 0) {
    return <ChartEmpty>아직 별점이 매겨진 영화가 없어요.</ChartEmpty>;
  }

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 150`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="별점 분포"
    >
      <line x1={8} x2={totalWidth - 8} y1={baselineY} y2={baselineY} stroke="var(--rule)" strokeWidth={1} />
      {data.map((b, i) => {
        const h = (b.count / max) * chartHeight;
        const x = i * slotWidth + 8;
        const y = baselineY - h;
        // Half-step buckets (.5) get the secondary accent so the chart visually
        // groups whole-star and half-star ratings.
        const isWhole = b.rating % 1 === 0;
        const fill = b.count > 0
          ? (isWhole ? 'var(--accent)' : 'var(--accent-2)')
          : 'var(--bg-3)';
        return (
          <g key={b.rating}>
            <rect
              x={x + (slotWidth - barWidth) / 2}
              y={y}
              width={barWidth}
              height={h}
              fill={fill}
              rx={2}
            >
              <title>{`${b.rating.toFixed(1)}점: ${b.count}편`}</title>
            </rect>
            <text
              x={x + slotWidth / 2}
              y={baselineY + 16}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-muted)"
            >
              {b.rating.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Horizontal bars (genre / decade) ────────────────────────────── */

function HorizontalBars({
  data,
  emptyLabel,
}: {
  data: CountedItem[];
  emptyLabel: string;
}) {
  if (data.length === 0) return <ChartEmpty>{emptyLabel}</ChartEmpty>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((row) => {
        const pct = (row.count / max) * 100;
        return (
          <div
            key={row.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr 36px',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={row.name}
            >
              {row.name}
            </div>
            <div
              style={{
                background: 'var(--bg-3)',
                borderRadius: 3,
                height: 10,
                overflow: 'hidden',
              }}
              aria-hidden="true"
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: 'var(--accent)',
                  transition: 'width 0.18s ease',
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {row.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Director ranking ────────────────────────────────────────────── */

function DirectorRanking({ data }: { data: CountedItem[] }) {
  if (data.length === 0) return <ChartEmpty>감독 정보가 없어요.</ChartEmpty>;
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
      {data.map((row, i) => (
        <li
          key={row.name}
          style={{
            display: 'grid',
            gridTemplateColumns: '24px 1fr auto',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
            borderBottom: i === data.length - 1 ? 'none' : '1px solid var(--rule)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: i === 0 ? 'var(--accent)' : 'var(--text-muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={row.name}
          >
            {row.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {row.count}편
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ─── Tiny in-card empty state ────────────────────────────────────── */

function ChartEmpty({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: '24px 0',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Page-level empty state ──────────────────────────────────────── */

function StatsEmpty({ onCta }: { onCta: () => void }) {
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
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 4 4 5-5" />
        </svg>
      </div>
      <div style={{ maxWidth: 420 }}>
        <h2 className="t-h2" style={{ margin: 0, color: 'var(--text)' }}>
          기록된 영화가 없어 통계를 표시할 수 없어요
        </h2>
        <div
          style={{
            marginTop: 10,
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--text-muted)',
          }}
        >
          영화를 한 편 기록하면 월별 시청, 별점 분포, 장르·감독·연대까지 한눈에 볼 수 있어요.
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
