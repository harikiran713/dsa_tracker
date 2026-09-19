export interface LeetCodeSyncResult {
  solvedIds: number[];
  solvedSlugs: string[];
  totalSolved: number;
  syncedAt: string;
}

const SYNC_KEY_PREFIX = 'leetcode_sync_';

function syncKey(userId: string): string {
  return `${SYNC_KEY_PREFIX}${userId}`;
}

export function loadLeetCodeSync(userId: string): LeetCodeSyncResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(syncKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLeetCodeSync(userId: string, result: LeetCodeSyncResult): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(syncKey(userId), JSON.stringify(result));
}

export function clearLeetCodeSync(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(syncKey(userId));
}

/** Pulls the LeetCode problem slug out of a stored `leetcodeUrl`. */
export function slugFromLeetCodeUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/\/problems\/([^/]+)\/?/);
  return match ? match[1] : null;
}

function isValidSyncPayload(value: unknown): value is LeetCodeSyncResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.solvedIds) &&
    v.solvedIds.every((id) => typeof id === 'number') &&
    Array.isArray(v.solvedSlugs) &&
    v.solvedSlugs.every((slug) => typeof slug === 'string')
  );
}

/**
 * Sends the pasted LEETCODE_SESSION cookie value to our server, which uses it
 * to fetch the solved-problems list from LeetCode on the user's behalf. The
 * token itself is never stored — only the derived solved-id/slug list is kept.
 */
export async function syncLeetCodeSession(sessionToken: string): Promise<LeetCodeSyncResult> {
  const res = await fetch('/api/leetcode-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    throw new Error((data && data.error) || `Sync failed (status ${res.status}).`);
  }

  if (!isValidSyncPayload(data)) {
    throw new Error('LeetCode returned unexpected data — try again.');
  }

  return {
    solvedIds: data.solvedIds,
    solvedSlugs: data.solvedSlugs,
    totalSolved: data.solvedIds.length,
    syncedAt: new Date().toISOString(),
  };
}
