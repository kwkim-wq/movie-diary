// StarInput — interactive 0-5 / 0.5 step rating widget.
//
// Spec: design-handoff/handoff.html §4.2.
//   - hover preview shows the half/full state per star (left half = .5,
//     right half = 1.0).
//   - clicking the same value again drops it by 0.5 (toggle).
//   - keyboard: ←/→ ±0.5, 0–5 sets integer values, Home/End set 0/5.
//   - role="radiogroup", aria-valuenow/min/max on the wrapper.

import { useState } from 'react';

const STAR_PATH =
  'M12 2 L14.7 8.6 L21.8 9.2 L16.5 13.9 L18.1 21 L12 17.2 L5.9 21 L7.5 13.9 L2.2 9.2 L9.3 8.6 Z';
const EMPTY_STROKE = 'rgba(156,163,175,0.4)';
const ACCENT = '#62D26F';

export interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  /** Per-star pixel size; defaults to 24 (modal sizing). */
  pixelSize?: number;
  /** Custom aria-label for the group. */
  label?: string;
}

function clamp(v: number): number {
  if (v < 0) return 0;
  if (v > 5) return 5;
  return Math.round(v * 2) / 2;
}

export function StarInput({
  value,
  onChange,
  pixelSize = 24,
  label = '별점',
}: StarInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next = value;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = clamp(value + 0.5);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = clamp(value - 0.5);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = 5;
    else if (/^[0-5]$/.test(e.key)) next = Number(e.key);
    else return;
    e.preventDefault();
    if (next !== value) onChange(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHover(null)}
      style={{
        display: 'inline-flex',
        gap: 2,
        outline: 'none',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = display >= i ? 1 : display >= i - 0.5 ? 0.5 : 0;
        const fillColor = ACCENT;
        return (
          <span
            key={i}
            style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}
            role="radio"
            aria-checked={value >= i}
          >
            {/* Left half (0.5) hit area */}
            <span
              onMouseEnter={() => setHover(i - 0.5)}
              onClick={() => {
                const next = i - 0.5;
                onChange(value === next ? clamp(next - 0.5) : next);
              }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: pixelSize / 2,
                height: pixelSize,
                zIndex: 2,
              }}
              aria-hidden="true"
            />
            {/* Right half (1.0) hit area */}
            <span
              onMouseEnter={() => setHover(i)}
              onClick={() => {
                const next = i;
                onChange(value === next ? clamp(next - 0.5) : next);
              }}
              style={{
                position: 'absolute',
                left: pixelSize / 2,
                top: 0,
                width: pixelSize / 2,
                height: pixelSize,
                zIndex: 2,
              }}
              aria-hidden="true"
            />
            <svg
              width={pixelSize}
              height={pixelSize}
              viewBox="0 0 24 24"
              style={{ display: 'block' }}
              aria-hidden="true"
            >
              <defs>
                <clipPath id={`star-input-half-${i}`}>
                  <rect x="0" y="0" width="12" height="24" />
                </clipPath>
              </defs>
              <path
                d={STAR_PATH}
                fill="none"
                stroke={fill === 0 ? EMPTY_STROKE : fillColor}
                strokeWidth="1.5"
              />
              {fill === 1 && <path d={STAR_PATH} fill={fillColor} />}
              {fill === 0.5 && (
                <path
                  d={STAR_PATH}
                  fill={fillColor}
                  clipPath={`url(#star-input-half-${i})`}
                />
              )}
            </svg>
          </span>
        );
      })}
    </div>
  );
}
