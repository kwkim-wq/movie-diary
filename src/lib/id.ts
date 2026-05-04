/**
 * Build a stable entry id from the watch date, title, and rewatch index.
 * Schema: "e_{YYYY-MM-DD}_{title}_{n}" — matches design-handoff/handoff.html §7.
 *
 * The title segment keeps Korean characters as-is and only strips ASCII
 * separators that would interfere with the underscore delimiter.
 */
export function entryId(watchedISO: string, title: string, rewatchCount: number): string {
  const date = (watchedISO || '').slice(0, 10) || 'unknown';
  const safeTitle = (title || 'untitled')
    .trim()
    .replace(/[\s_]+/g, '-') // collapse whitespace + underscores into one dash
    .replace(/[\\/]/g, '-'); // strip path separators
  return `e_${date}_${safeTitle}_${rewatchCount}`;
}
