// AppHeader — unified appbar used by both list and detail screens.
// Inline styles copied verbatim from design-handoff/scene-list.jsx and scene-detail.jsx.
//
// Phase 6 added: responsive nav scrolling (.nav-scroller), shrinking padding via
// `.app-header-bar`, and a hidden "+ 새 영화 기록" label on phone widths.
// Phase 8 added: a settings cog rendered next to the search input — only when
// `showSearch` is on, since detail/actor pages render their own right slot.

import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

export type NavKey = 'all' | 'year' | 'liked' | 'lists' | 'actors' | 'stats';

interface NavItem {
  key: NavKey;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'all', label: '전체' },
  { key: 'year', label: '2026' },
  { key: 'liked', label: '좋아요' },
  { key: 'lists', label: '리스트' },
  { key: 'actors', label: '배우' },
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
  /** Click handler for nav items — receives the NavKey. */
  onNavClick?: (key: NavKey) => void;
}

export function AppHeader({
  showNav = true,
  activeNav,
  showSearch = true,
  searchValue = '',
  onSearchChange,
  rightSlot,
  onBrandClick,
  onCreate,
  onNavClick,
}: AppHeaderProps) {
  const navigate = useNavigate();
  return (
    <div style={{ borderBottom: '1px solid var(--rule)', background: 'var(--bg)' }}>
      <div
        className="app-header-bar"
        style={{
          minHeight: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            minWidth: 0,
            flex: '1 1 auto',
          }}
        >
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
            <svg
              width="22"
              height="22"
              viewBox="0 0 1024 1024"
              style={{ flexShrink: 0, display: 'block' }}
              aria-hidden="true"
            >
              <rect width="1024" height="1024" rx="224" ry="224" fill="var(--bg)" />
              <path
                d="M512 168 L613 386 L848 416 L675 580 L719 814 L512 700 L305 814 L349 580 L176 416 L411 386 Z"
                fill="var(--accent)"
              />
              <path d="M452 432 L452 624 L612 528 Z" fill="var(--bg)" />
            </svg>
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

          {/* Nav — scroll horizontally when the row is too narrow. */}
          {showNav && (
            <nav className="nav-scroller" aria-label="주 메뉴">
              {NAV_ITEMS.map(({ key, label }) => {
                const active = key === activeNav;
                return (
                  <div
                    key={key}
                    role={onNavClick ? 'button' : undefined}
                    tabIndex={onNavClick ? 0 : undefined}
                    onClick={() => onNavClick?.(key)}
                    onKeyDown={(e) => {
                      if (!onNavClick) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onNavClick(key);
                      }
                    }}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: active ? 'var(--text)' : 'var(--text-muted)',
                      cursor: onNavClick ? 'pointer' : 'default',
                      padding: '4px 0',
                      borderBottom: active
                        ? '2px solid var(--accent)'
                        : '2px solid transparent',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
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
              <>
                <div className="header-search" style={{ position: 'relative', width: 240 }}>
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
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="설정"
                  title="설정"
                  onClick={() => navigate('/settings')}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </>
            )}
            <button
              type="button"
              className="btn-primary"
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={onCreate}
              aria-label="새 영화 기록"
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
              <span className="header-create-label">새 영화 기록</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
