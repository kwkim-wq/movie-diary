// Stars — read-only rating display (0–5, 0.5 step). Inline-flex SVG path × 5,
// half-fill via clipPath. Mirrors design-handoff/marks.jsx exactly.
//
// Phase 3 covers the read-only renderer. Interactive star input (mouse/keyboard)
// belongs to a later phase and should reuse this same SVG geometry.

import { useId } from 'react';

export type StarsSize = 'sm' | 'md' | 'lg';

export interface StarsProps {
  /** Rating from 0 to 5, in 0.5 steps. */
  rating: number;
  /** Pre-defined size (sm = 11, md = 14, lg = 20). Overridden by `pixelSize`. */
  size?: StarsSize;
  /** Explicit pixel size (used by the list card overlay's 13/20 px variants). */
  pixelSize?: number;
  /** Gap between stars in px. Defaults to 1. */
  gap?: number;
  /** Override the fill colour (defaults to var(--accent)). */
  color?: string;
}

const SIZE_MAP: Record<StarsSize, number> = { sm: 11, md: 14, lg: 20 };
const STAR_PATH =
  'M12 2 L14.7 8.6 L21.8 9.2 L16.5 13.9 L18.1 21 L12 17.2 L5.9 21 L7.5 13.9 L2.2 9.2 L9.3 8.6 Z';
const EMPTY_STROKE = 'rgba(156,163,175,0.4)';

export function Stars({
  rating,
  size = 'md',
  pixelSize,
  gap = 1,
  color = '#62D26F',
}: StarsProps) {
  const px = pixelSize ?? SIZE_MAP[size];
  // useId guarantees a stable, unique base id even with multiple <Stars> on screen.
  const baseId = useId();

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0;
    const clipId = `${baseId}-half-${i}`;
    stars.push(
      <svg
        key={i}
        width={px}
        height={px}
        viewBox="0 0 24 24"
        style={{ display: 'block' }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
        <path
          d={STAR_PATH}
          fill="none"
          stroke={fill === 0 ? EMPTY_STROKE : color}
          strokeWidth="1.5"
        />
        {fill === 1 && <path d={STAR_PATH} fill={color} />}
        {fill === 0.5 && (
          <path d={STAR_PATH} fill={color} clipPath={`url(#${clipId})`} />
        )}
      </svg>,
    );
  }

  return (
    <div
      className="stars"
      role="img"
      aria-label={`별점 ${rating} / 5`}
      style={{ display: 'inline-flex', gap }}
    >
      {stars}
    </div>
  );
}
