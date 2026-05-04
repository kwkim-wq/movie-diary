// Aggregations across the entries collection — kept here so the routes can
// stay declarative. Right now this only covers actor rollups; phase 6 may
// pull more of ListPage's compareEntries/applyFilter into this module.

import type { ActorSummary, MovieEntry } from '../types';

/**
 * Walk every entry's cast and produce one row per unique TMDB person id.
 * Counts and the "liked anywhere" flag aggregate with OR; the average rating
 * is over the set of entries the actor appears in (NaN when none are rated).
 *
 * The first occurrence's `name` and `profilePath` win — TMDB sometimes
 * returns slightly different name encodings across `credits` payloads, but
 * sticking with first-seen keeps the output stable.
 */
export function aggregateActors(entries: MovieEntry[]): ActorSummary[] {
  type Bucket = {
    summary: ActorSummary;
    /** Sum of ratings to compute the average lazily at the end. */
    ratingSum: number;
    /** Number of rated (rating > 0) entries the actor appears in. */
    ratedCount: number;
  };
  const map = new Map<number, Bucket>();

  for (const entry of entries) {
    if (!entry.cast || entry.cast.length === 0) continue;
    // Dedupe within a single entry (rare, but possible if TMDB lists an actor
    // twice). Otherwise the same entry would inflate movieCount by 2.
    const seenInEntry = new Set<number>();
    for (const member of entry.cast) {
      if (seenInEntry.has(member.id)) continue;
      seenInEntry.add(member.id);
      const existing = map.get(member.id);
      if (existing) {
        existing.summary.movieCount += 1;
        existing.summary.likedInAny = existing.summary.likedInAny || member.liked;
        if (entry.rating > 0) {
          existing.ratingSum += entry.rating;
          existing.ratedCount += 1;
        }
      } else {
        map.set(member.id, {
          summary: {
            id: member.id,
            name: member.name,
            profilePath: member.profilePath,
            movieCount: 1,
            likedInAny: member.liked,
            averageRating: Number.NaN, // backfilled below
          },
          ratingSum: entry.rating > 0 ? entry.rating : 0,
          ratedCount: entry.rating > 0 ? 1 : 0,
        });
      }
    }
  }

  return Array.from(map.values()).map(({ summary, ratingSum, ratedCount }) => ({
    ...summary,
    averageRating: ratedCount > 0 ? ratingSum / ratedCount : Number.NaN,
  }));
}

/** Entries that mention a given TMDB person id, in original order. */
export function entriesByActor(entries: MovieEntry[], actorId: number): MovieEntry[] {
  return entries.filter((e) => (e.cast || []).some((c) => c.id === actorId));
}
