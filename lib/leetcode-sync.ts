export interface LeetCodeSyncResult {
  solvedIds: number[];
  solvedSlugs: string[];
  totalSolved: number;
  syncedAt: string;
}

const SESSION_KEY_PREFIX = 'leetcode_session_';
const SYNC_KEY_PREFIX = 'leetcode_sync_';

function sessionKey(userId: string): string {
  return `${SESSION_KEY_PREFIX}${userId}`;
}

function syncKey(userId: string): string {
  return `${SYNC_KEY_PREFIX}${userId}`;
}

/** Session cookie stays local-only — never sent to our DB, only ever forwarded
 * transiently to our own proxy route to call LeetCode on the user's behalf. */
export function loadLeetCodeSession(userId: string): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(sessionKey(userId)) || '';
}

export function saveLeetCodeSession(userId: string, session: string): void {
  if (typeof window === 'undefined') return;
  if (session) {
    localStorage.setItem(sessionKey(userId), session);
  } else {
    localStorage.removeItem(sessionKey(userId));
  }
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
  localStorage.removeItem(sessionKey(userId));
}

export async function fetchLeetCodeSync(session: string): Promise<LeetCodeSyncResult> {
  const res = await fetch('/api/leetcode-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || `Sync failed (${res.status})`);
  }
  return body as LeetCodeSyncResult;
}

/** Pulls the LeetCode problem slug out of a stored `leetcodeUrl`. */
export function slugFromLeetCodeUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/\/problems\/([^/]+)\/?/);
  return match ? match[1] : null;
}
