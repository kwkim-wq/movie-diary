// SCENE 1 — Main list (Letterboxd-style cinephile DB, dark)

const Scene_List = () => {
  const movies = window.SAMPLE_MOVIES;
  // Pre-compute a couple of "featured" stats
  const totalCount = 137;
  const thisYear = 42;
  const avgRating = 4.1;

  const Header = () => (
    <div style={{ borderBottom: '1px solid var(--rule)', background: 'var(--bg)' }}>
      <div style={{ padding: '20px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg)' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>Movie Diary</div>
          </div>
          {/* Nav */}
          <nav style={{ display: 'flex', gap: 22, flexShrink: 0 }}>
            {[['전체', true], ['2026', false], ['좋아요', false], ['리스트', false], ['통계', false]].map(([t, active]) => (
              <div key={t} style={{ fontSize: 13, fontWeight: 500, color: active ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', padding: '4px 0', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', whiteSpace: 'nowrap' }}>{t}</div>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* search */}
          <div style={{ position: 'relative', width: 240 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input className="input" placeholder="영화, 감독 검색…" style={{ paddingLeft: 34, fontSize: 13, padding: '8px 14px 8px 34px', background: 'var(--bg-2)' }} />
          </div>
          <button className="btn-primary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            새 영화 기록
          </button>
        </div>
      </div>
    </div>
  );

  const StatBlock = ({ value, label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', whiteSpace: 'nowrap' }}>{value}</div>
      <div className="t-tiny" style={{ whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );

  const MovieCard = ({ m, hover }) => {
    const dateLabel = new Date(m.watched).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
    return (
      <div className={`movie-card ${hover ? 'is-hover' : ''}`}>
        <div className="poster-wrap">
          <Poster kind={m.poster} />
          <div className="poster-overlay">
            <div style={{ width: '100%' }}>
              <Stars value={m.rating} size={13} gap={1} />
              <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(229,231,235,0.85)', marginTop: 6 }}>{dateLabel} 감상</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, padding: '0 2px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, letterSpacing: '-0.005em' }}>{m.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <Stars value={m.rating} size={11} gap={1} />
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{new Date(m.watched).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="scene app-root" style={{ minHeight: 1640 }}>
      <Header />

      {/* Hero stat bar */}
      <div style={{ padding: '40px 56px 28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32 }}>
        <div>
          <div className="t-tiny" style={{ marginBottom: 10 }}>나의 영화 일기</div>
          <h1 className="t-h1" style={{ margin: 0, fontSize: 36 }}>최근 본 영화</h1>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>2026년에 본 작품 · 시간순으로 정렬됨</div>
        </div>
        <div style={{ display: 'flex', gap: 48, paddingBottom: 4 }}>
          <StatBlock value={totalCount} label="총 기록" />
          <StatBlock value={thisYear} label="2026년" />
          <StatBlock value={<span>{avgRating}<span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500 }}> / 5</span></span>} label="평균 별점" />
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '0 56px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['최신순', '별점순', '연도순', '제목순'].map((t, i) => (
            <button key={t} className="btn-ghost" style={i === 0 ? { background: 'var(--bg-3)', borderColor: 'var(--bg-hover)' } : {}}>{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>9 / {totalCount}편 표시</div>
          <div style={{ width: 1, height: 18, background: 'var(--rule)' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-icon" style={{ background: 'var(--bg-3)', color: 'var(--text)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button className="btn-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '36px 56px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '32px 24px' }}>
          {movies.map((m, i) => <MovieCard key={m.id} m={m} hover={i === 0} />)}
        </div>

        <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center' }}>
          <button className="btn-ghost" style={{ padding: '12px 28px' }}>더 불러오기</button>
        </div>
      </div>
    </div>
  );
};

window.Scene_List = Scene_List;
