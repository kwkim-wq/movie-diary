// SettingsPage — /settings. Three sections:
//   1. TMDB API 키 (masked + 변경/설정하기)
//   2. 데이터 (export · import · localStorage 사용량)
//   3. 위험 (모든 데이터 지우기 — 이중 확인)
//
// Uses storage.exportJSON / importJSON / clearAll helpers — no new reducer
// actions; the destructive path goes through dispatch({ type: 'importState' })
// with a fresh defaultState().

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader, type NavKey } from '../components/AppHeader';
import { useMovies } from '../hooks/useMovies';
import {
  clearAll,
  defaultState,
  exportJSON,
  getStorageUsage,
  importJSON,
} from '../lib/storage';
import { pullEntries, pushEntries, mergeEntries } from '../lib/sync';

/** Mask the TMDB key for display: first 4 + ellipsis + last 8. */
function maskKey(raw: string): string {
  const k = (raw || '').trim();
  if (!k) return '';
  if (k.length <= 12) return `${'•'.repeat(Math.max(0, k.length - 2))}${k.slice(-2)}`;
  return `${k.slice(0, 4)}…${k.slice(-8)}`;
}

function bytesLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function todayIsoForFilename(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface SectionProps {
  kicker: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: 'default' | 'danger';
}

function Section({ kicker, title, description, children, tone = 'default' }: SectionProps) {
  return (
    <div
      style={{
        background: 'var(--bg-2)',
        border:
          tone === 'danger'
            ? '1px solid rgba(255, 130, 130, 0.45)'
            : '1px solid var(--rule)',
        borderRadius: 'var(--radius)',
        padding: 24,
      }}
    >
      <div className="t-tiny" style={{ marginBottom: 8 }}>
        {kicker}
      </div>
      <h2
        className="t-h2"
        style={{
          margin: 0,
          color: tone === 'danger' ? '#ff8a8a' : 'var(--text)',
        }}
      >
        {title}
      </h2>
      {description && (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          {description}
        </div>
      )}
      <div style={{ marginTop: 18 }}>{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { state, settings, entries, dispatch, hydrated, setSetting } = useMovies();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Forces the storage usage stat to recompute after a destructive/import action.
  const [usageTick, setUsageTick] = useState(0);

  const [syncUrlDraft, setSyncUrlDraft] = useState('');
  const [syncTokenDraft, setSyncTokenDraft] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle');

  // hydration 완료 후 localStorage에서 로드된 값으로 draft 초기화
  useEffect(() => {
    if (!hydrated) return;
    setSyncUrlDraft(settings.syncUrl ?? '');
    setSyncTokenDraft(settings.syncToken ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const handleSaveSync = useCallback(() => {
    setSetting('syncUrl', syncUrlDraft.trim());
    setSetting('syncToken', syncTokenDraft.trim());
    setSyncStatus('idle');
  }, [setSetting, syncUrlDraft, syncTokenDraft]);

  const handleManualSync = useCallback(async () => {
    const url = syncUrlDraft.trim();
    const token = syncTokenDraft.trim();
    if (!url || !token) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 4000);
      return;
    }
    setSyncStatus('syncing');
    try {
      const remote = await pullEntries(url, token);
      const merged = mergeEntries(entries, remote);
      dispatch({ type: 'load', payload: { ...state, entries: merged } });
      await pushEntries(url, token, merged);
      setSyncStatus('ok');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error('[sync] manual sync failed', err);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  }, [syncUrlDraft, syncTokenDraft, entries, state, dispatch]);

  const usage = useMemo(() => getStorageUsage(), [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    state,
    usageTick,
  ]);

  // Liked-actor count = number of unique actor ids that are hearted on any entry.
  const likedActorCount = useMemo(() => {
    const ids = new Set<number>();
    for (const e of entries) {
      for (const c of e.cast || []) {
        if (c.liked) ids.add(c.id);
      }
    }
    return ids.size;
  }, [entries]);

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

  const handleChangeKey = () => {
    navigate({ search: '?modal=tmdb-key' });
  };

  const handleExport = () => {
    try {
      const text = exportJSON(state);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movie-diary-backup-${todayIsoForFilename()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[settings] export failed', err);
      window.alert('내보내기에 실패했습니다.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file twice still fires onChange next time.
    e.target.value = '';
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch (err) {
      console.error('[settings] file read failed', err);
      window.alert('파일을 읽을 수 없습니다.');
      return;
    }
    let nextState;
    try {
      nextState = importJSON(text);
    } catch (err) {
      console.error('[settings] import parse failed', err);
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      window.alert(`파일을 읽을 수 없습니다.\n${msg}`);
      return;
    }
    const ok = window.confirm(
      `기존 데이터를 덮어씁니다. 진행할까요?\n\n` +
        `· 영화 ${nextState.entries.length}편\n` +
        `· TMDB 키 ${nextState.settings.tmdbKey ? '있음' : '없음'}`,
    );
    if (!ok) return;
    dispatch({ type: 'importState', payload: nextState });
    setUsageTick((n) => n + 1);
    window.alert('복원되었습니다.');
  };

  const handleWipe = () => {
    const ok1 = window.confirm(
      '정말 모든 영화 기록을 삭제할까요? 되돌릴 수 없습니다.',
    );
    if (!ok1) return;
    const typed = window.prompt("확인을 위해 '삭제'라고 입력하세요");
    if (typed !== '삭제') {
      if (typed !== null) {
        window.alert('확인 문구가 일치하지 않아 취소되었습니다.');
      }
      return;
    }
    // Wipe storage first, then reset the in-memory tree.
    try {
      clearAll();
    } catch (err) {
      console.error('[settings] clearAll failed', err);
    }
    dispatch({ type: 'importState', payload: defaultState() });
    setUsageTick((n) => n + 1);
    window.alert('모든 데이터가 삭제되었습니다.');
    navigate('/');
  };

  if (!hydrated) return null;

  const masked = maskKey(settings.tmdbKey);

  return (
    <div className="scene app-root" style={{ minHeight: '100vh' }}>
      <AppHeader
        showNav
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
            SETTINGS
          </div>
          <h1 className="t-h1 hero-title" style={{ margin: 0, fontSize: 36 }}>
            설정
          </h1>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
            TMDB 키 관리, 데이터 백업/복원, 전체 초기화
          </div>
        </div>
      </div>

      {/* Sections */}
      <div
        className="page-pad"
        style={{
          padding: '8px 56px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          maxWidth: 880,
        }}
      >
        {/* 1. TMDB API 키 */}
        <Section
          kicker="TMDB API 키"
          title="자동완성 / 포스터 / 배우 정보용"
          description="키는 이 브라우저의 로컬 스토리지에만 저장되며 외부로 전송되지 않습니다."
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>현재 키</div>
              <div
                style={{
                  fontFamily: 'Inter, monospace',
                  fontSize: 14,
                  fontWeight: 600,
                  color: masked ? 'var(--text)' : 'var(--text-faint)',
                  letterSpacing: 0,
                }}
              >
                {masked || '미설정'}
              </div>
            </div>
            <button type="button" className="btn-ghost" onClick={handleChangeKey}>
              {masked ? '변경' : '설정하기'}
            </button>
          </div>
        </Section>

        {/* 2. 기기간 동기화 */}
        <Section
          kicker="기기간 동기화"
          title="서버 동기화"
          description="EC2 서버 URL과 토큰을 입력하면 아이폰·다른 기기에서 같은 데이터를 사용할 수 있습니다."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>서버 URL</label>
              <input
                type="url"
                value={syncUrlDraft}
                onChange={(e) => setSyncUrlDraft(e.target.value)}
                placeholder="https://diary.barybody-ai.xyz"
                style={{
                  background: 'var(--bg-3)',
                  border: '1px solid var(--rule)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  color: 'var(--text)',
                  fontSize: 13,
                  fontFamily: 'Inter, monospace',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>토큰</label>
              <input
                type="password"
                value={syncTokenDraft}
                onChange={(e) => setSyncTokenDraft(e.target.value)}
                placeholder="Bearer token"
                style={{
                  background: 'var(--bg-3)',
                  border: '1px solid var(--rule)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  color: 'var(--text)',
                  fontSize: 13,
                  fontFamily: 'Inter, monospace',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn-primary" onClick={handleSaveSync}>
                저장
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing'}
              >
                {syncStatus === 'syncing' ? '동기화 중…' : '지금 동기화'}
              </button>
              {syncStatus === 'ok' && (
                <span style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--accent)',
                  background: 'rgba(98,210,111,0.12)', padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid rgba(98,210,111,0.3)',
                }}>✓ 동기화 완료</span>
              )}
              {syncStatus === 'error' && (
                <span style={{
                  fontSize: 13, fontWeight: 600, color: '#ff8a8a',
                  background: 'rgba(255,130,130,0.10)', padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,130,130,0.3)',
                }}>
                  {!syncUrlDraft.trim() || !syncTokenDraft.trim()
                    ? 'URL과 토큰을 입력 후 저장해주세요'
                    : '연결 실패 — URL·토큰을 확인해주세요'}
                </span>
              )}
            </div>
            {settings.syncUrl && (
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                현재 저장된 서버: {settings.syncUrl}
              </div>
            )}
          </div>
        </Section>

        {/* 3. 데이터 */}
        <Section
          kicker="데이터"
          title="백업과 복원"
          description="JSON 한 파일로 전체 기록을 가져오거나 내보낼 수 있습니다."
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              marginBottom: 18,
            }}
          >
            <Stat label="영화 기록" value={`${entries.length}편`} />
            <Stat label="좋아한 배우" value={`${likedActorCount}명`} />
            <Stat
              label="저장공간"
              value={
                <span>
                  {usage.percent.toFixed(1)}%
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                    }}
                  >
                    ({bytesLabel(usage.bytes)} / 5 MB)
                  </span>
                </span>
              }
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary" onClick={handleExport}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              JSON 내보내기
            </button>
            <button type="button" className="btn-ghost" onClick={handleImportClick}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                JSON 가져오기
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        </Section>

        {/* 4. 위험 */}
        <Section
          kicker="DANGER ZONE"
          title="모든 데이터 지우기"
          description="모든 영화 기록과 설정을 삭제합니다. 이 작업은 되돌릴 수 없으니, 먼저 JSON 내보내기로 백업해두세요."
          tone="danger"
        >
          <button
            type="button"
            onClick={handleWipe}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 130, 130, 0.55)',
              color: '#ff8a8a',
              padding: '10px 18px',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'background 0.12s, border-color 0.12s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,130,130,0.10)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            모든 데이터 지우기
          </button>
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--bg-3)',
        border: '1px solid var(--rule)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    </div>
  );
}
