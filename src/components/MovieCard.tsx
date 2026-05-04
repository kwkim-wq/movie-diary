// MovieCard — single tile in the main list grid. Inline styles preserved
// verbatim from design-handoff/scene-list.jsx (the MovieCard sub-component).

import { useState } from 'react';
import type { MovieEntry } from '../types';
import { Poster } from './Poster';
import { Stars } from './Stars';

export interface MovieCardProps {
  entry: MovieEntry;
  onClick?: () => void;
  /** When true, render the hover overlay regardless of pointer state. Useful for previews. */
  forceHover?: boolean;
}

const KOREAN_FULL_DATE = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
const KOREAN_SHORT_DATE = new Intl.DateTimeFormat('ko-KR', {
  month: 'short',
  day: 'numeric',
});

export function MovieCard({ entry, onClick, forceHover = false }: MovieCardProps) {
  const [pressedFromKeyboard, setPressedFromKeyboard] = useState(false);
  const watchedDate = new Date(entry.watched);
  const fullLabel = KOREAN_FULL_DATE.format(watchedDate);
  const shortLabel = KOREAN_SHORT_DATE.format(watchedDate);

  return (
    <div
      className={`movie-card${forceHover ? ' is-hover' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setPressedFromKeyboard(true);
          onClick();
        }
      }}
      onBlur={() => setPressedFromKeyboard(false)}
      aria-pressed={onClick ? pressedFromKeyboard : undefined}
    >
      <div className="poster-wrap">
        <Poster
          posterPath={entry.posterPath}
          posterKind={entry.posterKind}
          title={entry.title}
          size="card"
        />
        <div className="poster-overlay">
          <div style={{ width: '100%' }}>
            <Stars rating={entry.rating} pixelSize={13} gap={1} />
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(229,231,235,0.85)',
                marginTop: 6,
              }}
            >
              {fullLabel} 감상
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, padding: '0 2px' }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.35,
            letterSpacing: '-0.005em',
          }}
        >
          {entry.title}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
          }}
        >
          <Stars rating={entry.rating} pixelSize={11} gap={1} />
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
            {shortLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
