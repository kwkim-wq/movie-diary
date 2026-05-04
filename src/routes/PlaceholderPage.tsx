// PlaceholderPage — used for "리스트" / "통계" routes that are out of scope for v1.
// Renders the AppHeader so navigation still works, plus a centred message + home link.

import { useNavigate } from 'react-router-dom';
import { AppHeader, type NavKey } from '../components/AppHeader';

interface PlaceholderPageProps {
  /** Title of the page, e.g. "리스트 — 준비 중". */
  label: string;
  /** Which nav tab to highlight. */
  activeNav?: NavKey;
}

export function PlaceholderPage({ label, activeNav }: PlaceholderPageProps) {
  const navigate = useNavigate();

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
        activeNav={activeNav}
        showSearch={false}
        onBrandClick={() => navigate('/')}
        onNavClick={handleNavClick}
        onCreate={() => navigate({ search: '?modal=new' })}
      />
      <div
        style={{
          padding: '120px 56px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          textAlign: 'center',
        }}
      >
        <div className="t-tiny">COMING SOON</div>
        <h1 className="t-h1" style={{ margin: 0 }}>
          {label}
        </h1>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 420, lineHeight: 1.6 }}>
          이 화면은 v1 범위에 포함되지 않았습니다. 다음 단계에서 추가됩니다.
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => navigate('/')}
          style={{ marginTop: 8 }}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
