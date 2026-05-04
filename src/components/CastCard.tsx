// CastCard — single actor tile, shared between DetailPage's "배우" section
// and the /actors grid. Inline styles follow the dark-card tone from the
// design handoff (var(--bg-2), 6px radius, var(--shadow-card)).
//
// The heart toggle is optional: omit `onToggleLike` (e.g. the /actors page
// shows aggregated state across many entries) to render a static badge.

import { useState } from 'react';
import { profileUrl } from '../lib/tmdb';

export interface CastCardProps {
  /** TMDB person id — used for the navigate fallback. */
  id: number;
  name: string;
  /** Subtitle. On the entry detail page this is "as 배역명"; on the actors
   *  index it's "X편 출연". Either way we render exactly what's passed. */
  subtitle?: string;
  profilePath: string | null;
  /** Whether the heart should render as filled. */
  liked: boolean;
  /** Hide the heart toggle entirely (e.g. when the parent only displays state). */
  showHeart?: boolean;
  /** Disable the heart's click handler (e.g. aggregated card). When falsey AND
   *  showHeart is true the badge shows but is non-interactive. */
  onToggleLike?: () => void;
  /** Card click — usually navigate('/actor/:id'). */
  onClick?: () => void;
}

/** Build initials from a name. Korean names: first 2 chars; otherwise first letters. */
function initialsFor(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';
  // Heuristic: any Hangul present → use first two characters.
  if (/[가-힯]/.test(trimmed)) return trimmed.slice(0, 2);
  // Latin-style: pick the first letter of each whitespace-separated token, max 2.
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function CastCard({
  name,
  subtitle,
  profilePath,
  liked,
  showHeart = true,
  onToggleLike,
  onClick,
}: CastCardProps) {
  const url = profileUrl(profilePath, 'w185');
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(url) && !imgFailed;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        background: 'var(--bg-2)',
        borderRadius: 6,
        border: '1px solid var(--rule)',
        boxShadow: 'var(--shadow-card)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.18s ease, border-color 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Avatar — 2:3 portrait crop, matching poster aspect ratio. */}
      <div
        style={{
          aspectRatio: '2/3',
          background: 'var(--bg-3)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
      >
        {showImage ? (
          <img
            src={url ?? undefined}
            alt={name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <span aria-hidden="true">{initialsFor(name)}</span>
        )}

        {showHeart && (
          <button
            type="button"
            aria-pressed={liked}
            aria-label={liked ? '좋아요 취소' : '좋아요'}
            disabled={!onToggleLike}
            onClick={(e) => {
              if (!onToggleLike) return;
              // Keep the heart from triggering the parent's onClick.
              e.stopPropagation();
              onToggleLike();
            }}
            onKeyDown={(e) => {
              // Same — block space/enter from bubbling to the parent button.
              if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
            }}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(20, 24, 28, 0.7)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: liked ? 'var(--accent)' : 'var(--text)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: onToggleLike ? 'pointer' : 'default',
              padding: 0,
              backdropFilter: 'blur(2px)',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}
      </div>

      {/* Caption — clipped to two lines for character names like "조실장". */}
      <div style={{ padding: '10px 12px 12px', minHeight: 56 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.3,
            letterSpacing: '-0.005em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
        {subtitle && (
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              fontWeight: 400,
              color: 'var(--text-muted)',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
