// NotFoundPage — generic 404. Reachable from invalid routes or a missing entry id.

import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="scene app-root" style={{ minHeight: '100vh' }}>
      <AppHeader
        showNav={false}
        showSearch={false}
        onBrandClick={() => navigate('/')}
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
        <div className="t-tiny">404 · NOT FOUND</div>
        <h1 className="t-h1" style={{ margin: 0 }}>
          찾을 수 없는 페이지입니다
        </h1>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 420, lineHeight: 1.6 }}>
          주소가 변경되었거나, 해당하는 기록이 삭제되었을 수 있습니다.
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/')}
          style={{ marginTop: 8 }}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
