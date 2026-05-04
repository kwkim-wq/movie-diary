// AppHeader — unified appbar used by both list and detail screens.
// Inline styles copied verbatim from design-handoff/scene-list.jsx and scene-detail.jsx.
//
// Phase 4 will wire the nav links + search to the router/state. For now the
// active tab and search value are passed in as props.

import type { ReactNode } from 'react';

export type NavKey = 'all' | 'year' | 'liked' | 'lists' | 'stats';

interface NavItem {
  key: NavKey;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'all', label: '전체' },
  { key: 'year', label: '2026' },
  { key: 'liked', label: '좋아요' },
  { key: 'lists', label: '리스트' },
  { key: 'stats', label: '통계' },
];

export interface AppHeaderProps {
  /** Whether to render the nav row next to the brand. */
  showNav?: boolean;
  /** Currently-active nav item — controls the underline. */
  activeNav?: NavKey;
  /** Whether to render the search input on the right. */
  showSearch?: boolean;
  /** Controlled search value. */
  searchValue?: string;
  /** Search change handler. */
  onSearchChange?: (value: string) => void;
  /** Override the right-side slot entirely (e.g. detail page edit/delete buttons). */
  rightSlot?: ReactNode;
  /** Click handler for the brand mark — usually navigates to /. */
  onBrandClick?: () => void;
  /** Click handler for the "새 영화 기록" button. */
  onCreate?: () => void;
}

export function AppHeader({
  showNav = true,
  activeNav = 'all',
  showSearch = true,
  searchValue = '',
  onSearchChange,
  rightSlot,
  onBrandClick,
  onCreate,
}: AppHeaderProps) {
  return (
    <div style={{ borderBottom: '1px solid var(--rule)', background: 'var(--bg)' }}>
      <div
        style={{
          padding: '20px 56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexShrink: 0 }}>
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
              cursor: onBrandClick ? 'pointer' : 'default',
            }}
            onClick={onBrandClick}
            role={onBrandClick ? 'button' : undefined}
            tabIndex={onBrandClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (!onBrandClick) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onBrandClick();
              }
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg)' }} />
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              Movie Diary
            </div>
          </div>

          {/* Nav */}
          {showNav && (
            <nav style={{ display: 'flex', gap: 22, flexShrink: 0 }}>
              {NAV_ITEMS.map(({ key, label }) => {
                const active = key === activeNav;
                return (
                  <div
                    key={key}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: active ? 'var(--text)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px 0',
                      borderBottom: active
                        ? '2px solid var(--accent)'
                        : '2px solid transparent',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right side */}
        {rightSlot ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {rightSlot}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {showSearch && (
              <div style={{ position: 'relative', width: 240 }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  className="input"
                  placeholder="영화, 감독 검색…"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  aria-label="영화 검색"
                  style={{
                    paddingLeft: 34,
                    fontSize: 13,
                    padding: '8px 14px 8px 34px',
                    background: 'var(--bg-2)',
                  }}
                />
              </div>
            )}
            <button
              type="button"
              className="btn-primary"
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={onCreate}
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
              새 영화 기록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
