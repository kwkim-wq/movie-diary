// useDebounce — returns the input value delayed by `delay` ms. The standard
// "wait until typing stops" trick. Used by the TMDB autocomplete (250ms per
// design-handoff/handoff.html §6.4) and could be reused elsewhere.

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
