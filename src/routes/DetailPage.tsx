// DetailPage — full record view for one MovieEntry.
// Layout follows design-handoff/scene-detail.jsx (2-column hero, then memo and
// "이전 감상 기록" rows for the same TMDB id).

import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppHeader, type NavKey } from '../components/AppHeader';
import { CastCard } from '../components/CastCard';
import { Poster } from '../components/Poster';
import { Stars } from '../components/Stars';
import { useMovies } from '../hooks/useMovies';
import { NotFoundPage } from './NotFoundPage';

const KOREAN_FULL = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const KOREAN_FULL_WEEKDAY = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});
const KOREAN_TIME = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const KOREAN_MONTH = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' });

function runtimeLabel(min: number): string {
  if (!min || min <= 0) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="t-tiny" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

export function DetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [, setSearchParams] = useSearchParams();
  const {
    hydrated,
    getEntryById,
    getEntriesByTmdbId,
    dispatch,
    entries,
    toggleCastLike,
  } = useMovies();

  // Decode the URL-encoded id (it carries Korean + slashes-as-dashes from entryId()).
  const decodedId = useMemo(
    () => (params.id ? decodeURIComponent(params.id) : ''),
    [params.id],
  );

  // IMPORTANT: every hook must run on every render — we can't `return null`
  // before declaring useMemo etc. So we resolve the entry as a memoised value
  // and let every downstream hook tolerate `entry === undefined`.
  const entry = useMemo(
    () => (hydrated ? getEntryById(decodedId) : undefined),
    [hydrated, decodedId, getEntryById],
  );

  // Group same-film viewings by tmdbId, fall back to title matching when the user
  // recorded a manual entry without a TMDB id.
  const sameFilm = useMemo(() => {
    if (!entry) return [];
    if (entry.tmdbId != null) {
      return getEntriesByTmdbId(entry.tmdbId);
    }
    return entries.filter(
      (e) => e.title === entry.title && e.originalTitle === entry.originalTitle,
    );
  }, [entry, getEntriesByTmdbId, entries]);

  const previousViewings = useMemo(() => {
    if (!entry) return [];
    return sameFilm
      .filter((e) => e.id !== entry.id)
      .sort((a, b) => (b.watched || '').localeCompare(a.watched || ''));
  }, [sameFilm, entry]);

  // Index: how many viewings (chronological) is this one?
  const viewingIndex = useMemo(() => {
    if (!entry) return 1;
    const sorted = [...sameFilm].sort((a, b) =>
      (a.watched || '').localeCompare(b.watched || ''),
    );
    const idx = sorted.findIndex((e) => e.id === entry.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [sameFilm, entry]);

  if (!hydrated) return null;
  if (!entry) {
    return <NotFoundPage />;
  }
  const watchedDate = new Date(entry.watched);

  const handleEdit = () => {
    setSearchParams((sp) => {
      sp.set('modal', 'edit');
      sp.set('id', entry.id);
      return sp;
    });
  };

  const handleDelete = () => {
    const ok = window.confirm(`"${entry.title}" 기록을 삭제할까요? 되돌릴 수 없습니다.`);
    if (!ok) return;
    dispatch({ type: 'deleteEntry', payload: { id: entry.id } });
    navigate('/');
  };

  const handleToggleLike = () => {
    dispatch({ type: 'toggleLike', payload: { id: entry.id } });
  };

  return (
    <div className="scene app-root" style={{ minHeight: '100vh' }}>
      <AppHeader
        showSearch={false}
        onBrandClick={() => navigate('/')}
        onNavClick={(key: NavKey) => {
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
        }}
        rightSlot={
          <>
            <button type="button" className="btn-ghost" onClick={handleEdit}>
              편집
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleDelete}
              style={{ color: 'var(--text)' }}
            >
              삭제
            </button>
          </>
        }
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
            onClick={() => navigate(-1)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(-1);
              }
            }}
          >
            ← 목록으로
          </span>
          <span style={{ color: 'var(--text-faint)' }}>/</span>
          <span>{KOREAN_MONTH.format(watchedDate)}</span>
          <span style={{ color: 'var(--text-faint)' }}>/</span>
          <span style={{ color: 'var(--text)' }}>{entry.title}</span>
        </div>
      </div>

      {/* Hero: 380px poster + meta column */}
      <div
        className="detail-hero page-pad"
        style={{
          padding: '32px 56px 48px',
        }}
      >
        <div className="detail-poster">
          <div
            style={{
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              aspectRatio: '2/3',
              boxShadow: 'var(--shadow-card)',
              outline: '1px solid rgba(255,255,255,0.06)',
              outlineOffset: -1,
            }}
          >
            <Poster
              posterPath={entry.posterPath}
              posterKind={entry.posterKind}
              title={entry.title}
              size="detail"
            />
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleToggleLike}
              style={{
                flex: 1,
                color: entry.liked ? 'var(--accent)' : undefined,
                borderColor: entry.liked ? 'var(--accent)' : undefined,
              }}
              aria-pressed={entry.liked}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={entry.liked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {entry.liked ? '좋아요 됨' : '좋아요'}
              </span>
            </button>
            <button
              type="button"
              className="btn-ghost"
              style={{ flex: 1 }}
              onClick={() => navigate('/lists')}
              title="v1 범위 외 — 준비 중"
            >
              리스트에 추가
            </button>
          </div>
        </div>

        <div>
          <div className="t-tiny" style={{ marginBottom: 12 }}>
            일기 #{Math.max(1, entries.length - entries.findIndex((e) => e.id === entry.id))} ·{' '}
            {viewingIndex}번째 감상
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
            {entry.title}
          </h1>
          <div
            style={{
              marginTop: 8,
              fontSize: 16,
              color: 'var(--text-muted)',
              fontWeight: 400,
            }}
          >
            <span style={{ fontStyle: 'italic' }}>{entry.originalTitle}</span>
            {entry.year ? ` · ${entry.year}` : ''}
            {entry.runtime ? ` · ${runtimeLabel(entry.runtime)}` : ''}
          </div>

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Stars rating={entry.rating} pixelSize={20} gap={2} />
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>
              {entry.rating.toFixed(1)}
            </div>
            <div style={{ width: 1, height: 18, background: 'var(--rule-strong)' }} />
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {KOREAN_FULL_WEEKDAY.format(watchedDate)} {KOREAN_TIME.format(watchedDate)}
            </div>
          </div>

          {(entry.genres?.length ?? 0) > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {entry.genres.map((g) => (
                <span
                  key={g}
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    border: '1px solid var(--rule-strong)',
                    padding: '3px 9px',
                    borderRadius: 999,
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Credits panel — only the fields we actually have. */}
          {(Boolean(entry.director) || entry.year > 0 || entry.runtime > 0) && (
            <div
              style={{
                marginTop: 32,
                background: 'var(--bg-2)',
                borderRadius: 'var(--radius)',
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                rowGap: 16,
                columnGap: 24,
              }}
            >
              {entry.director && <Stat label="감독" value={entry.director} />}
              {entry.originalTitle && entry.originalTitle !== entry.title && (
                <Stat label="원제" value={entry.originalTitle} />
              )}
              {entry.year > 0 && <Stat label="개봉 연도" value={`${entry.year}년`} />}
              {entry.runtime > 0 && (
                <Stat label="러닝타임" value={runtimeLabel(entry.runtime)} />
              )}
            </div>
          )}

          {/* Memo */}
          {entry.note && (
            <div style={{ marginTop: 36 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <h2 className="t-h2" style={{ margin: 0 }}>
                  감상 메모
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  {entry.note.length}자 ·{' '}
                  {KOREAN_FULL.format(new Date(entry.createdAt || entry.watched))} 작성
                </div>
              </div>
              <div
                style={{
                  background: 'var(--bg-2)',
                  borderRadius: 'var(--radius)',
                  padding: '24px 28px',
                  borderLeft: '3px solid var(--accent)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <p className="t-body-lg" style={{ margin: 0, color: 'var(--text)' }}>
                  {entry.note}
                </p>
              </div>
              {(entry.tags?.length ?? 0) > 0 && (
                <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {entry.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--accent)',
                        background: 'rgba(98,210,111,0.08)',
                        padding: '4px 10px',
                        borderRadius: 4,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tag chips when there is no memo */}
          {!entry.note && (entry.tags?.length ?? 0) > 0 && (
            <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {entry.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--accent)',
                    background: 'rgba(98,210,111,0.08)',
                    padding: '4px 10px',
                    borderRadius: 4,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Cast — only when TMDB credits gave us at least one row. */}
          {(entry.cast?.length ?? 0) > 0 && (
            <div style={{ marginTop: 40 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <h2 className="t-h2" style={{ margin: 0 }}>
                  배우
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  {entry.cast.length}명 · 좋았던 배우는 ❤️ 표시
                </div>
              </div>
              <div className="cast-grid">
                {entry.cast.map((member) => (
                  <CastCard
                    key={`${entry.id}:${member.id}`}
                    id={member.id}
                    name={member.name}
                    subtitle={member.character ? `as ${member.character}` : undefined}
                    profilePath={member.profilePath}
                    liked={member.liked}
                    onToggleLike={() => toggleCastLike(entry.id, member.id)}
                    onClick={() => navigate(`/actor/${member.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other watches of this film */}
          {previousViewings.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <div className="t-tiny" style={{ marginBottom: 14 }}>
                이전 감상 기록
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {previousViewings.map((w) => (
                  <div
                    key={w.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/entry/${encodeURIComponent(w.id)}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/entry/${encodeURIComponent(w.id)}`);
                      }
                    }}
                    style={{
                      padding: '14px 0',
                      borderTop: '1px solid var(--rule)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 18,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 110,
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                      }}
                    >
                      {KOREAN_FULL.format(new Date(w.watched))}
                    </div>
                    <Stars rating={w.rating} pixelSize={13} gap={1} />
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text)',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {w.note || <span style={{ color: 'var(--text-faint)' }}>메모 없음</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
