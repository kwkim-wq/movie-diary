// EC2 cross-device sync helpers.
// Protocol: full-replace PUT (last-write-wins per entry, resolved by updatedAt).

import type { MovieEntry } from '../types';

export async function pullEntries(syncUrl: string, syncToken: string): Promise<MovieEntry[]> {
  const res = await fetch(`${syncUrl}/entries`, {
    headers: { Authorization: `Bearer ${syncToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`sync pull ${res.status}`);
  return res.json() as Promise<MovieEntry[]>;
}

export async function pushEntries(
  syncUrl: string,
  syncToken: string,
  entries: MovieEntry[],
): Promise<void> {
  const res = await fetch(`${syncUrl}/entries`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${syncToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entries),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`sync push ${res.status}`);
}

/**
 * Merge remote entries into local: for each id, keep the version with the
 * later `updatedAt`. Entries that exist only on one side are included as-is.
 */
export function mergeEntries(local: MovieEntry[], remote: MovieEntry[]): MovieEntry[] {
  const map = new Map<string, MovieEntry>();
  for (const e of local) map.set(e.id, e);
  for (const e of remote) {
    const existing = map.get(e.id);
    if (!existing || e.updatedAt > existing.updatedAt) {
      map.set(e.id, e);
    }
  }
  return Array.from(map.values());
}
