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

/**
 * Runs entirely in the user's own browser, on the leetcode.com origin, using
 * their already-logged-in session — no cookie ever has to be located or
 * copied, and no session token ever reaches our server. It copies the result
 * straight to the clipboard so it can be pasted back into the sync box.
 */
export const LEETCODE_SYNC_SCRIPT = `(async () => {
  const res = await fetch('/api/problems/all/', { credentials: 'include' });
  const data = await res.json();
  if (!data.user_name) {
    alert('Not logged in to LeetCode in this tab — log in first, then re-run this script.');
    return;
  }
  const pairs = Array.isArray(data.stat_status_pairs) ? data.stat_status_pairs : [];
  const solvedIds = [];
  const solvedSlugs = [];
  for (const p of pairs) {
    if (p.status !== 'ac') continue;
    const id = p.stat?.frontend_question_id ?? p.stat?.question_id;
    if (typeof id === 'number') solvedIds.push(id);
    if (typeof p.stat?.question__title_slug === 'string') solvedSlugs.push(p.stat.question__title_slug);
  }
  const result = { solvedIds, solvedSlugs, totalSolved: solvedIds.length, syncedAt: new Date().toISOString() };
  const json = JSON.stringify(result);
  await navigator.clipboard.writeText(json);
  alert('Copied ' + solvedIds.length + ' solved problems to your clipboard. Go back to PrepTracker and paste it in.');
})();`;

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

/** Parses the JSON a user pastes back after running {@link LEETCODE_SYNC_SCRIPT}. */
export function parsePastedSyncPayload(raw: string): LeetCodeSyncResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    throw new Error("That doesn't look like valid data — paste the full output the script copied, unedited.");
  }

  if (!isValidSyncPayload(parsed)) {
    throw new Error("That doesn't look like valid sync data — make sure you copied the full script output.");
  }

  return {
    solvedIds: parsed.solvedIds,
    solvedSlugs: parsed.solvedSlugs,
    totalSolved: parsed.solvedIds.length,
    syncedAt: new Date().toISOString(),
  };
}
