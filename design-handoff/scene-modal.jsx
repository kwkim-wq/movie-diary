// SCENE 3 — Add/Edit modal (dark cinephile DB)

const Scene_Modal = () => {
  const movies = window.SAMPLE_MOVIES.slice(0, 5);
  const query = '화양';
  const selectedIdx = 0;
  const rating = 4.5;
  const memo = '다시 봤다. 빨간 벽지와 첼로 한 음. 두 사람의 눈을 두 번 다시 마주치지 않게 만드는 카메라가 야속하다. 골목에서 만나는 장면, 비 오는 호텔 복도. 옷의 색이 매번 다르다는 것을 처음 알아차린 밤.';

  const Backdrop = () => (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)' }}>
      <div style={{ padding: '40px 56px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24, opacity: 0.5, filter: 'blur(1px)' }}>
        {movies.concat(movies).map((m, i) => (
          <div key={i}>
            <div style={{ aspectRatio: '2/3', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}><Poster kind={m.poster} /></div>
            <div style={{ height: 14, background: 'var(--bg-3)', borderRadius: 3, marginTop: 10, width: '70%' }} />
            <div style={{ height: 10, background: 'var(--bg-3)', borderRadius: 3, marginTop: 6, width: '40%' }} />
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20, 24, 28, 0.78)', backdropFilter: 'blur(4px)' }} />
    </div>
  );

  const suggestions = [
    { title: '화양연화', titleEn: 'In the Mood for Love', year: 2000, director: '왕가위', country: '홍콩', poster: 'wong' },
    { title: '화양연화 2046', titleEn: '2046', year: 2004, director: '왕가위', country: '홍콩', poster: 'wong' },
    { title: '화차', titleEn: 'Helpless', year: 2012, director: '변영주', country: '한국', poster: 'noir' },
  ];

  return (
    <div className="scene app-root" style={{ minHeight: 1640, position: 'relative' }}>
      <Backdrop />

      <div style={{ position: 'absolute', left: '50%', top: 80, transform: 'translateX(-50%)', width: 720, zIndex: 10 }}>
        <div style={{ background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--rule-strong)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
          {/* Modal header */}
          <div style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--rule)' }}>
            <div>
              <div className="t-tiny" style={{ marginBottom: 4 }}>NEW ENTRY</div>
              <h2 className="t-h2" style={{ margin: 0 }}>새 영화 기록</h2>
            </div>
            <button className="btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 28px' }}>

            {/* Field 1 — Title with TMDB autocomplete */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>영화 제목 <span style={{ color: 'var(--accent)' }}>*</span></label>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>TMDB에서 자동 검색</span>
              </div>
              <div style={{ position: 'relative' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <input className="input" value={query} readOnly style={{ paddingLeft: 38, fontSize: 15, fontWeight: 500, borderColor: 'var(--accent)' }} />
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent)' }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.4s infinite' }} />
                  검색 중
                </div>

                {/* Autocomplete dropdown */}
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-3)', border: '1px solid var(--rule-strong)', borderRadius: 'var(--radius-sm)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 5, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>검색 결과 3건</span>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>↑↓ 선택 · ⏎ 확정</span>
                  </div>
                  {suggestions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: i === selectedIdx ? 'rgba(98, 210, 111, 0.10)' : 'transparent', cursor: 'pointer', borderBottom: i < 2 ? '1px solid var(--rule)' : 'none' }}>
                      <div style={{ width: 38, height: 56, borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}><Poster kind={s.poster} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.title} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}> · {s.titleEn}</span></div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{s.year} · {s.director} · {s.country}</div>
                      </div>
                      {i === selectedIdx && <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase' }}>선택됨</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: 220 }} />

            {/* Field 2 + 3 — date + rating */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>본 날짜 <span style={{ color: 'var(--accent)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <input className="input" value="2026년 5월 4일 (월)" readOnly style={{ paddingLeft: 38, fontSize: 14, fontWeight: 500 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>별점 <span style={{ color: 'var(--accent)' }}>*</span></label>
                <div className="input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px' }}>
                  <Stars value={rating} size={20} gap={2} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{rating.toFixed(1)} <span style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: 12 }}> / 5</span></div>
                </div>
              </div>
            </div>

            {/* Field 4 — memo */}
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>감상 메모</label>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{memo.length} / 2000자</span>
              </div>
              <div style={{ position: 'relative' }}>
                <textarea className="input" value={memo} readOnly style={{ minHeight: 140, fontSize: 14, lineHeight: 1.7, padding: '14px 16px' }} />
                <span style={{ position: 'absolute', right: 16, bottom: 14, fontSize: 11, color: 'var(--text-faint)' }}>마크다운 지원</span>
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginTop: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>태그</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', padding: '8px 12px', background: 'var(--bg-3)', border: '1px solid var(--rule-strong)', borderRadius: 'var(--radius-sm)', minHeight: 40 }}>
                {['#재관람', '#홍콩'].map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: 'var(--accent)', background: 'rgba(98,210,111,0.10)', padding: '3px 8px', borderRadius: 3 }}>
                    {t}
                    <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>×</span>
                  </span>
                ))}
                <input style={{ flex: 1, minWidth: 100, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} placeholder="태그 추가… (Enter)" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 28px', borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.6"/><path d="M21 4v6h-6"/></svg>
              로컬 스토리지에 자동 저장
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost">취소</button>
              <button className="btn-primary">기록 저장</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
};

window.Scene_Modal = Scene_Modal;
