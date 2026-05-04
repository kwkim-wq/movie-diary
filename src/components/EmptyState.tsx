// EmptyState — shown on the list pages when entries.length === 0.
// Centred large CTA "+ 첫 영화 기록"; clicking opens the new-entry modal.

interface EmptyStateProps {
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({
  title = '아직 기록한 영화가 없습니다',
  description = '본 영화를 한 편 한 편 기록해두면 별점, 메모, 태그까지 한 곳에 모입니다.',
  ctaLabel = '+ 첫 영화 기록',
  onCta,
}: EmptyStateProps) {
  return (
    <div
      style={{
        padding: '80px 56px 120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        textAlign: 'center',
      }}
    >
      {/* Decorative film-frame icon — pure SVG, accent color, no emoji. */}
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
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 4v16M17 4v16M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4" />
        </svg>
      </div>

      <div style={{ maxWidth: 420 }}>
        <h2 className="t-h2" style={{ margin: 0, color: 'var(--text)' }}>
          {title}
        </h2>
        <div
          style={{
            marginTop: 10,
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--text-muted)',
          }}
        >
          {description}
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
        {ctaLabel.replace(/^\+\s*/, '')}
      </button>
    </div>
  );
}
