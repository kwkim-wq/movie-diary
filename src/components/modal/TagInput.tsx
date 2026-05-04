// TagInput — chip + inline input. The user can type with or without the
// leading `#`; we always store tags with `#` prefix (consistent with how the
// detail page renders them).
//
// Spec: design-handoff/handoff.html §4.5.
//   - Enter or comma adds the chip.
//   - Backspace on an empty input pops the last chip.
//   - Duplicates are silently rejected (with a small shake animation).
//   - The input row mirrors the design (chip layout, "태그 추가… (Enter)" placeholder).

import { useRef, useState } from 'react';

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

function normaliseTag(input: string): string | null {
  const trimmed = input.trim().replace(/^#+/, '').trim();
  if (!trimmed) return null;
  // Collapse whitespace inside the tag to underscore so chips render cleanly.
  const cleaned = trimmed.replace(/\s+/g, '_');
  return `#${cleaned}`;
}

export function TagInput({
  value,
  onChange,
  placeholder = '태그 추가… (Enter)',
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 240);
  };

  const commit = () => {
    const tag = normaliseTag(draft);
    if (!tag) {
      setDraft('');
      return;
    }
    if (value.includes(tag)) {
      triggerShake();
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault();
      removeAt(value.length - 1);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
        padding: '8px 12px',
        background: 'var(--bg-3)',
        border: '1px solid var(--rule-strong)',
        borderRadius: 'var(--radius-sm)',
        minHeight: 40,
        cursor: 'text',
        animation: shake ? 'tag-shake 0.24s' : undefined,
      }}
    >
      {value.map((t, i) => (
        <span
          key={`${t}-${i}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--accent)',
            background: 'rgba(98,210,111,0.10)',
            padding: '3px 8px',
            borderRadius: 3,
          }}
        >
          {t}
          <span
            role="button"
            tabIndex={0}
            aria-label={`${t} 태그 제거`}
            onClick={(e) => {
              e.stopPropagation();
              removeAt(i);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                removeAt(i);
              }
            }}
            style={{ color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </span>
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : ''}
        style={{
          flex: 1,
          minWidth: 100,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text)',
          fontSize: 13,
          fontFamily: 'inherit',
        }}
        aria-label="태그 추가"
      />
      <style>{`@keyframes tag-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        50% { transform: translateX(3px); }
        75% { transform: translateX(-2px); }
      }`}</style>
    </div>
  );
}
