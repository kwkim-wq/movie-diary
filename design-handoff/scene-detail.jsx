// SCENE 2 — Detail (dark cinephile DB)

const Scene_Detail = () => {
  const m = window.SAMPLE_MOVIES[0]; // 화양연화

  const Header = () => (
    <div style={{ borderBottom: '1px solid var(--rule)', background: 'var(--bg)' }}>
      <div style={{ padding: '20px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg)' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>Movie Diary</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button className="btn-ghost">편집</button>
          <button className="btn-ghost">삭제</button>
        </div>
      </div>
    </div>
  );

  const Stat = ({ label, value }) => (
    <div>
      <div className="t-tiny" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
    </div>
  );

  return (
    <div className="scene app-root" style={{ minHeight: 1640 }}>
      <Header />

      {/* Breadcrumb */}
      <div style={{ padding: '20px 56px 0' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ cursor: 'pointer' }}>← 목록으로</span>
          <span style={{ color: 'var(--text-faint)' }}>/</span>
          <span>2026년 4월</span>
          <span style={{ color: 'var(--text-faint)' }}>/</span>
          <span style={{ color: 'var(--text)' }}>화양연화</span>
        </div>
      </div>

      {/* Hero — 2-column */}
      <div style={{ padding: '32px 56px 48px', display: 'grid', gridTemplateColumns: '380px 1fr', gap: 56 }}>
        <div>
          <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', aspectRatio: '2/3', boxShadow: 'var(--shadow-card)', outline: '1px solid rgba(255,255,255,0.06)' }}>
            <Poster kind={m.poster} />
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-7-10.5a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 10.5C19 16.5 12 21 12 21z"/></svg>
                좋아요
              </span>
            </button>
            <button className="btn-ghost" style={{ flex: 1 }}>리스트에 추가</button>
          </div>
        </div>

        <div>
          <div className="t-tiny" style={{ marginBottom: 12 }}>일기 #137 · 3번째 감상</div>
          <h1 style={{ margin: 0, fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1 }}>화양연화</h1>
          <div style={{ marginTop: 8, fontSize: 16, color: 'var(--text-muted)', fontWeight: 400 }}>
            <span style={{ fontStyle: 'italic' }}>In the Mood for Love</span> · 2000 · 1시간 38분
          </div>

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Stars value={5} size={20} gap={2} />
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>5.0</div>
            <div style={{ width: 1, height: 18, background: 'var(--rule-strong)' }} />
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>2026년 4월 22일 · 수요일 23:14</div>
          </div>

          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {m.genres.concat(['홍콩']).map(g => (
              <span key={g} style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', border: '1px solid var(--rule-strong)', padding: '3px 9px', borderRadius: 999 }}>{g}</span>
            ))}
          </div>

          {/* Credits panel */}
          <div style={{ marginTop: 32, background: 'var(--bg-2)', borderRadius: 'var(--radius)', padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 16, columnGap: 24 }}>
            <Stat label="감독" value="왕가위 (Wong Kar-wai)" />
            <Stat label="각본" value="왕가위" />
            <Stat label="주연" value="양조위 · 장만옥" />
            <Stat label="촬영" value="크리스토퍼 도일 · 마크 리 핑빙" />
            <Stat label="국가" value="홍콩 / 프랑스" />
            <Stat label="개봉" value="2000년 9월 29일" />
          </div>

          {/* Memo */}
          <div style={{ marginTop: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 className="t-h2" style={{ margin: 0 }}>감상 메모</h2>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>492자 · 2026.04.22 작성</div>
            </div>
            <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius)', padding: '24px 28px', borderLeft: '3px solid var(--accent)' }}>
              <p className="t-body-lg" style={{ margin: 0, color: 'var(--text)' }}>
                복도와 계단, 빨간 벽지의 호텔. 첼로의 한 음이 끝없이 늘어진다. 두 사람은 서로의 삶을 거울처럼 비추다, 결국 비밀 하나를 나무 구멍에 묻고 떠난다. 절제된 슬픔이 이렇게 사치스러울 수 있나.
              </p>
              <p className="t-body-lg" style={{ marginTop: 16, marginBottom: 0, color: 'var(--text)' }}>
                두 번째 볼 땐 옷이 보였고, 세 번째 볼 땐 먹는 장면이 보였다. 그릇 하나, 면 한 가닥이 사람과 사람의 거리를 그려낸다. 다음엔 무엇이 보일까.
              </p>
              <p className="t-body" style={{ marginTop: 16, marginBottom: 0, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                "그 시절, 그녀는 몰래 고개를 돌려 그를 보았다. 그도 그녀를 보고 있었다."
              </p>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['#재관람', '#홍콩', '#왕가위_5선', '#밤에보면_좋은'].map(t => (
                <span key={t} style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)', background: 'rgba(98,210,111,0.08)', padding: '4px 10px', borderRadius: 4 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Other watches of this film */}
          <div style={{ marginTop: 40 }}>
            <div className="t-tiny" style={{ marginBottom: 14 }}>이전 감상 기록</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { date: '2024년 11월 14일', rating: 4.5, note: '도일의 카메라가 이렇게 가까이 왔던가. 흔들리는 프레임 안에서 두 사람이 멀어진다.' },
                { date: '2022년 8월 03일', rating: 4, note: '첫 감상. 무슨 영화인지 잘 모르겠는데 자꾸 생각난다.' },
              ].map((w, i) => (
                <div key={i} style={{ padding: '14px 0', borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ width: 110, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{w.date}</div>
                  <Stars value={w.rating} size={13} />
                  <div style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{w.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Scene_Detail = Scene_Detail;
