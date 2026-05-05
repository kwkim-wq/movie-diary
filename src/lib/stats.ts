// Pure aggregation helpers for the /stats page.
//
// All functions are deterministic, side-effect free, and only depend on the
// MovieEntry array passed in — they never read localStorage or call TMDB.
// Keep them pure so they're easy to memoise in components and easy to unit
// test if we ever add tests.

import type { MovieEntry } from '../types';

/* ─── Totals (hero strip) ─────────────────────────────────────────── */

export interface StatsTotals {
  /** entries.length */
  count: number;
  /** Sum of runtime (minutes). Skips entries with non-positive runtime. */
  totalRuntime: number;
  /** Mean of `rating` over rated entries (rating > 0). 0 when nothing is rated. */
  avgRating: number;
  /** How many entries are hearted. */
  likedCount: number;
}

export function getTotals(entries: MovieEntry[]): StatsTotals {
  let totalRuntime = 0;
  let ratingSum = 0;
  let ratedCount = 0;
  let likedCount = 0;
  for (const e of entries) {
    if (typeof e.runtime === 'number' && e.runtime > 0) totalRuntime += e.runtime;
    if (typeof e.rating === 'number' && e.rating > 0) {
      ratingSum += e.rating;
      ratedCount += 1;
    }
    if (e.liked) likedCount += 1;
  }
  const avgRating = ratedCount > 0 ? ratingSum / ratedCount : 0;
  return { count: entries.length, totalRuntime, avgRating, likedCount };
}

/* ─── Monthly counts (last 12 months) ─────────────────────────────── */

export interface MonthlyCount {
  /** Sortable key, e.g. '2026-04'. */
  ym: string;
  /** Compact label for the bar chart x-axis, e.g. '4월'. */
  label: string;
  count: number;
}

/**
 * Last 12 calendar months ending on the *current* month (today's clock).
 * The window is anchored to "now" rather than the latest watched date so
 * the chart visibly thins out when the user stops recording — which is the
 * signal we actually want to show.
 */
export function getMonthlyCounts(entries: MovieEntry[]): MonthlyCount[] {
  const now = new Date();
  const buckets: MonthlyCount[] = [];
  // Build oldest → newest so the bars render left-to-right naturally.
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ ym, label: `${d.getMonth() + 1}월`, count: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.ym, i]));
  for (const e of entries) {
    if (!e.watched) continue;
    const ym = e.watched.slice(0, 7); // 'YYYY-MM'
    const idx = index.get(ym);
    if (idx === undefined) continue;
    buckets[idx].count += 1;
  }
  return buckets;
}

/* ─── Rating histogram (0.5 … 5.0) ────────────────────────────────── */

export interface RatingBucket {
  /** Bucket centre, one of 0.5, 1.0, 1.5, …, 5.0 (10 bins). */
  rating: number;
  count: number;
}

export function getRatingHistogram(entries: MovieEntry[]): RatingBucket[] {
  const buckets: RatingBucket[] = [];
  for (let i = 1; i <= 10; i++) {
    buckets.push({ rating: i / 2, count: 0 });
  }
  for (const e of entries) {
    if (typeof e.rating !== 'number' || e.rating <= 0) continue;
    // Snap to nearest 0.5; entries already store half-steps but be defensive.
    const snapped = Math.round(e.rating * 2) / 2;
    if (snapped < 0.5 || snapped > 5) continue;
    const idx = Math.round(snapped * 2) - 1; // 0.5 → 0, 5.0 → 9
    buckets[idx].count += 1;
  }
  return buckets;
}

/* ─── Top-N counts (genre / director) ─────────────────────────────── */

export interface CountedItem {
  name: string;
  count: number;
}

function topN(map: Map<string, number>, limit: number): CountedItem[] {
  const rows: CountedItem[] = [];
  for (const [name, count] of map) rows.push({ name, count });
  rows.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name, 'ko');
  });
  return rows.slice(0, limit);
}

export function getTopGenres(entries: MovieEntry[], limit = 5): CountedItem[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (!e.genres) continue;
    // Dedupe within an entry — a single movie tagged with the same genre
    // twice (rare) shouldn't count twice.
    const seen = new Set<string>();
    for (const g of e.genres) {
      const name = g.trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      map.set(name, (map.get(name) ?? 0) + 1);
    }
  }
  return topN(map, limit);
}

export function getTopDirectors(entries: MovieEntry[], limit = 5): CountedItem[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.mediaType === 'tv' && Array.isArray(e.creators) && e.creators.length > 0) {
      // TV entries: aggregate creators[] instead of director string
      const seen = new Set<string>();
      for (const creator of e.creators) {
        const name = creator.trim();
        if (!name || seen.has(name)) continue;
        seen.add(name);
        map.set(name, (map.get(name) ?? 0) + 1);
      }
    } else {
      const name = (e.director ?? '').trim();
      if (!name) continue;
      map.set(name, (map.get(name) ?? 0) + 1);
    }
  }
  return topN(map, limit);
}

/* ─── Decade buckets ──────────────────────────────────────────────── */

export interface DecadeBucket {
  /** Sortable key, e.g. '2020s'. */
  decade: string;
  /** Display label, e.g. '2020s'. */
  label: string;
  count: number;
}

/**
 * One row per decade *that has at least one entry*. Sorted newest → oldest
 * so the most recent decade reads first (matches the rest of the app's
 * "recent first" ordering).
 */
export function getDecadeCounts(entries: MovieEntry[]): DecadeBucket[] {
  const map = new Map<number, number>();
  for (const e of entries) {
    if (typeof e.year !== 'number' || e.year <= 0) continue;
    const decadeStart = Math.floor(e.year / 10) * 10;
    map.set(decadeStart, (map.get(decadeStart) ?? 0) + 1);
  }
  const rows: DecadeBucket[] = [];
  for (const [start, count] of map) {
    rows.push({ decade: `${start}s`, label: `${start}s`, count });
  }
  rows.sort((a, b) => parseInt(b.decade, 10) - parseInt(a.decade, 10));
  return rows;
}
