import { User, UserProgress } from './types';
import { CompletionEvent, DailyTodoItem, loadCompletionEvents, loadDailyTodos, saveDailyTodos, logCompletionEvent, dedupeCompletionEvents, completionEventId } from './activity';
import {
  DayTrackerData,
  emptyDayTracker,
  loadDayTracker,
  mergeDayTrackers,
  saveDayTracker,
} from './day-tracker';
import {
  LastMinPrepProgress,
  loadLastMinPrepProgress,
  saveLastMinPrepProgress,
} from './last-min-prep';
import {
  LldProgress,
  loadLldProgress,
  saveLldProgress,
  mergeLldProgress,
} from './lld';
import {
  AmazonPrepProgress,
  loadAmazonPrepProgress,
  saveAmazonPrepProgress,
} from './amazon-prep';
import {
  AmazonTweakProgress,
  loadAmazonTweakProgress,
  saveAmazonTweakProgress,
} from './amazon-tweak';
import {
  GooglePrepProgress,
  loadGooglePrepProgress,
  saveGooglePrepProgress,
} from './google-prep';
import {
  DesignPrepProgress,
  loadDesignPrepProgress,
  saveDesignPrepProgress,
} from './design-prep';
import { GoalNote, loadGoalNotes, saveGoalNotes } from './goal-notes';
import {
  LeaderboardEntry,
  LeaderboardPeriod,
} from './leaderboard';
import {
  ADMIN_USERNAME,
  type AdminOverview,
  type AdminResetScope,
  type AdminUserDetail,
} from './admin';

export type { User, UserProgress };

const USER_CACHE_KEY = 'interview_prep_user_cache';

function loadUserCache(): Record<string, User> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(USER_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUserToCache(user: User): void {
  if (typeof window === 'undefined') return;
  const cache = loadUserCache();
  cache[user.username] = user;
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cache));
  localStorage.setItem('interview_prep_user_id', user.id);
}

function rewriteStoredUserId(raw: string, oldUserId: string, newUserId: string): string {
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return JSON.stringify(
        data.map((item) =>
          item && typeof item === 'object'
            ? { ...item, user_id: item.user_id === oldUserId ? newUserId : item.user_id }
            : item
        )
      );
    }
    if (data && typeof data === 'object' && data.user_id === oldUserId) {
      return JSON.stringify({ ...data, user_id: newUserId });
    }
  } catch {
    // keep original
  }
  return raw;
}

/**
 * Only used when the SAME username upgrades from an offline-* id to a server id.
 * Never copy data between different accounts.
 */
function migrateLocalUserData(oldUserId: string, newUserId: string): void {
  if (!oldUserId || !newUserId || oldUserId === newUserId || typeof window === 'undefined') return;
  if (!oldUserId.startsWith('offline-')) return;

  for (const prefix of ['progress_', 'completion_events_', 'daily_todos_', 'day_tracker_', 'last_min_prep_', 'lld_progress_', 'amazon_prep_', 'amazon_tweak_prep_', 'google_prep_', 'design_prep_', 'goal_notes_']) {
    const oldKey = `${prefix}${oldUserId}`;
    const newKey = `${prefix}${newUserId}`;
    const oldData = localStorage.getItem(oldKey);
    if (!oldData) continue;

    const rewritten = rewriteStoredUserId(oldData, oldUserId, newUserId);
    const existing = localStorage.getItem(newKey);
    if (!existing) {
      localStorage.setItem(newKey, rewritten);
    } else if (prefix === 'progress_') {
      try {
        const merged = mergeProgress(JSON.parse(rewritten), JSON.parse(existing)).map((item) => ({
          ...item,
          user_id: newUserId,
          id: `${newUserId}-${item.question_id}`,
        }));
        localStorage.setItem(newKey, JSON.stringify(merged));
      } catch {
        // keep existing
      }
    }
    localStorage.removeItem(oldKey);
  }
}

function shouldMigrateOfflineData(
  previousId: string | null,
  username: string,
  newUserId: string
): boolean {
  if (!previousId || previousId === newUserId) return false;
  if (!previousId.startsWith('offline-')) return false;
  const cached = getCachedUser(username);
  return cached?.id === previousId;
}

function getCachedUser(username: string): User | null {
  return loadUserCache()[username] ?? null;
}

async function apiJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) {
      if (res.status >= 500) {
        console.warn(`[api] ${options?.method ?? 'GET'} ${url} unavailable (${res.status})`);
      }
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.warn(`[api] ${options?.method ?? 'GET'} ${url} error:`, error);
    return null;
  }
}

function isOnlineUserId(userId: string): boolean {
  return !userId.startsWith('offline-');
}

function toProgressRow(
  userId: string,
  questionId: number,
  questionTitle: string,
  questionPhase: string,
  status: 'todo' | 'done' | 'revise',
  notes: string,
  updatedAt: string
) {
  return {
    user_id: userId,
    question_id: questionId,
    question_title: questionTitle,
    question_phase: questionPhase,
    status,
    notes,
    updated_at: updatedAt,
  };
}

function mergeProgress(local: UserProgress[], remote: UserProgress[]): UserProgress[] {
  const merged = new Map<number, UserProgress>();
  for (const item of remote) merged.set(item.question_id, item);
  for (const item of local) {
    const existing = merged.get(item.question_id);
    if (!existing || new Date(item.updated_at) >= new Date(existing.updated_at)) {
      merged.set(item.question_id, item);
    }
  }
  return [...merged.values()].sort((a, b) => a.question_id - b.question_id);
}

function mergeTodos(local: DailyTodoItem[], remote: DailyTodoItem[]): DailyTodoItem[] {
  const merged = new Map<string, DailyTodoItem>();
  for (const item of remote) merged.set(item.id, item);
  for (const item of local) {
    const existing = merged.get(item.id);
    if (!existing || item.created_at >= existing.created_at) {
      merged.set(item.id, item);
    }
  }
  return [...merged.values()];
}

function mergeGoalNotes(local: GoalNote[], remote: GoalNote[]): GoalNote[] {
  const merged = new Map<string, GoalNote>();
  for (const item of remote) merged.set(item.id, item);
  for (const item of local) {
    const existing = merged.get(item.id);
    if (!existing || item.updated_at >= existing.updated_at) {
      merged.set(item.id, item);
    }
  }
  return [...merged.values()];
}

export async function fetchAllUsers(adminUsername: string): Promise<User[]> {
  const result = await apiJson<User[]>(
    `/api/users?list=1&admin=${encodeURIComponent(adminUsername)}`
  );
  return result ?? [];
}

export type NoteSearchSource = 'problems' | 'lastmin' | 'lld' | 'all';

export interface NoteSearchHit {
  source: 'problems' | 'lastmin' | 'lld';
  user_id: string;
  ref_id: string;
  title: string;
  status: string;
  notes: string;
  snippet: string;
  updated_at: string;
}

export interface NoteSearchResponse {
  q: string;
  userId: string;
  count: number;
  results: NoteSearchHit[];
}

/** Server-side search across personal notes (problems / last-min / LLD). */
export async function searchNotes(
  userId: string,
  q: string,
  source: NoteSearchSource = 'all',
  limit = 50
): Promise<NoteSearchResponse | null> {
  const params = new URLSearchParams({
    userId,
    q,
    source,
    limit: String(limit),
  });
  return apiJson<NoteSearchResponse>(`/api/notes/search?${params.toString()}`);
}

function adminQuery(pin: string, extra = ''): string {
  const base = `admin=${encodeURIComponent(ADMIN_USERNAME)}&pin=${encodeURIComponent(pin)}`;
  return extra ? `${base}&${extra}` : base;
}

export async function fetchAdminOverview(pin: string): Promise<AdminOverview | null> {
  return apiJson<AdminOverview>(`/api/admin?${adminQuery(pin, 'action=overview')}`);
}

export async function fetchAdminUserDetail(
  pin: string,
  userId: string
): Promise<AdminUserDetail | null> {
  return apiJson<AdminUserDetail>(
    `/api/admin?${adminQuery(pin, `action=user&userId=${encodeURIComponent(userId)}`)}`
  );
}

export async function adminResetUser(
  pin: string,
  userId: string,
  username: string,
  scope: AdminResetScope
): Promise<boolean> {
  const result = await apiJson<{ ok: boolean }>('/api/admin', {
    method: 'POST',
    body: JSON.stringify({
      admin: ADMIN_USERNAME,
      pin,
      action: 'reset',
      userId,
      username,
      scope,
    }),
  });
  return Boolean(result?.ok);
}

export async function adminSetLeaderboardHidden(
  pin: string,
  userId: string,
  username: string,
  hidden: boolean
): Promise<boolean> {
  const result = await apiJson<{ ok: boolean }>('/api/admin', {
    method: 'POST',
    body: JSON.stringify({
      admin: ADMIN_USERNAME,
      pin,
      action: hidden ? 'hide_leaderboard' : 'unhide_leaderboard',
      userId,
      username,
    }),
  });
  return Boolean(result?.ok);
}

export async function adminLogExport(pin: string): Promise<void> {
  await apiJson<{ ok: boolean }>('/api/admin', {
    method: 'POST',
    body: JSON.stringify({
      admin: ADMIN_USERNAME,
      pin,
      action: 'export_csv',
    }),
  });
}

export async function getOrCreateUser(username: string): Promise<User | null> {
  try {
    const previousId =
      typeof window !== 'undefined' ? localStorage.getItem('interview_prep_user_id') : null;

    const user = await apiJson<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });

    if (user) {
      if (shouldMigrateOfflineData(previousId, username, user.id)) {
        migrateLocalUserData(previousId!, user.id);
      }
      saveUserToCache(user);
      return user;
    }

    const cached = getCachedUser(username);
    if (cached) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('interview_prep_user_id', cached.id);
      }
      return cached;
    }

    const newUser: User = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      created_at: new Date().toISOString(),
    };

    saveUserToCache(newUser);
    return newUser;
  } catch (error) {
    console.error('Unexpected error in getOrCreateUser:', error);
    return getCachedUser(username);
  }
}

export async function syncProgressBatchToSupabase(
  userId: string,
  progress: UserProgress[]
): Promise<void> {
  if (!isOnlineUserId(userId) || progress.length === 0) return;

  const items = progress.map((p) =>
    toProgressRow(
      userId,
      p.question_id,
      p.question_title ?? '',
      p.question_phase ?? 'Easy',
      p.status,
      p.notes,
      p.updated_at
    )
  );

  await apiJson<{ ok: boolean }>('/api/progress', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export function getUserProgressLocal(userId: string): UserProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(`progress_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function syncUserProgressFromDb(userId: string): Promise<UserProgress[]> {
  const localProgress = getUserProgressLocal(userId).map((item) => ({
    ...item,
    user_id: userId,
    id: `${userId}-${item.question_id}`,
  }));
  if (!isOnlineUserId(userId)) {
    localStorage.setItem(`progress_${userId}`, JSON.stringify(localProgress));
    return localProgress;
  }

  const remoteProgress =
    (await apiJson<UserProgress[]>(`/api/progress?userId=${encodeURIComponent(userId)}`)) ?? [];

  const merged = mergeProgress(localProgress, remoteProgress).map((item) => ({
    ...item,
    user_id: userId,
    id: `${userId}-${item.question_id}`,
  }));
  localStorage.setItem(`progress_${userId}`, JSON.stringify(merged));

  if (merged.length > 0) {
    void syncProgressBatchToSupabase(userId, merged);
  }

  return merged;
}

export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  return syncUserProgressFromDb(userId);
}

export async function updateQuestionProgress(
  userId: string,
  questionId: number,
  questionTitle: string,
  questionPhase: string,
  status: 'todo' | 'done' | 'revise',
  notes: string
): Promise<boolean> {
  try {
    const updatedAt = new Date().toISOString();
    const progressItem: UserProgress = {
      id: `${userId}-${questionId}`,
      user_id: userId,
      question_id: questionId,
      question_title: questionTitle,
      question_phase: questionPhase,
      status,
      notes,
      updated_at: updatedAt,
    };

    const stored = localStorage.getItem(`progress_${userId}`);
    const progress: UserProgress[] = stored ? JSON.parse(stored) : [];
    const index = progress.findIndex((p) => p.question_id === questionId);
    const prevStatus = index >= 0 ? progress[index].status : null;
    if (index >= 0) {
      progress[index] = progressItem;
    } else {
      progress.push(progressItem);
    }
    localStorage.setItem(`progress_${userId}`, JSON.stringify(progress));

    if (status === 'done' && prevStatus !== 'done') {
      const event = logCompletionEvent(
        userId,
        questionId,
        questionTitle,
        questionPhase as 'Easy' | 'Medium' | 'Hard'
      );
      void syncCompletionEventToSupabase(event);
    }

    if (isOnlineUserId(userId)) {
      const result = await apiJson<{ ok: boolean }>('/api/progress', {
        method: 'POST',
        body: JSON.stringify(
          toProgressRow(userId, questionId, questionTitle, questionPhase, status, notes, updatedAt)
        ),
      });
      if (!result) {
        console.warn('[v0] MongoDB progress save failed — kept in localStorage');
      }
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in updateQuestionProgress:', error);
    return false;
  }
}

export async function getQuestionProgress(
  userId: string,
  questionId: number
): Promise<UserProgress | null> {
  const all = await getUserProgress(userId);
  return all.find((p) => p.question_id === questionId) ?? null;
}

export async function deleteUserProgress(userId: string, questionId: number): Promise<boolean> {
  try {
    const result = await apiJson<{ ok: boolean }>(
      `/api/progress?userId=${encodeURIComponent(userId)}&questionId=${questionId}`,
      { method: 'DELETE' }
    );
    return Boolean(result?.ok);
  } catch (error) {
    console.error('Unexpected error in deleteUserProgress:', error);
    return false;
  }
}

export async function resetUserProgress(userId: string): Promise<boolean> {
  try {
    const result = await apiJson<{ ok: boolean }>(
      `/api/progress?userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
    return Boolean(result?.ok);
  } catch (error) {
    console.error('Unexpected error in resetUserProgress:', error);
    return false;
  }
}

export async function syncCompletionEventToSupabase(event: CompletionEvent): Promise<void> {
  if (!isOnlineUserId(event.user_id)) return;
  await apiJson<{ ok: boolean }>('/api/completion-events', {
    method: 'POST',
    body: JSON.stringify({ event }),
  });
}

export async function syncCompletionEventsToSupabase(
  userId: string,
  events: CompletionEvent[]
): Promise<void> {
  if (!isOnlineUserId(userId) || events.length === 0) return;
  await apiJson<{ ok: boolean }>('/api/completion-events', {
    method: 'POST',
    body: JSON.stringify({ events }),
  });
}

export async function loadDailyTodosFromDb(userId: string): Promise<DailyTodoItem[]> {
  const local = loadDailyTodos(userId);
  if (!isOnlineUserId(userId)) return local;

  const remote =
    (await apiJson<DailyTodoItem[]>(
      `/api/daily-todos?userId=${encodeURIComponent(userId)}`
    )) ?? [];
  const merged = mergeTodos(local, remote);
  saveDailyTodos(userId, merged);
  return merged;
}

export async function syncDailyTodosToSupabase(
  userId: string,
  todos: DailyTodoItem[]
): Promise<void> {
  if (!isOnlineUserId(userId)) return;
  await apiJson<{ ok: boolean }>('/api/daily-todos', {
    method: 'PUT',
    body: JSON.stringify({ userId, todos }),
  });
}

export async function loadDayTrackerFromDb(userId: string): Promise<DayTrackerData> {
  const local = loadDayTracker(userId);
  if (!isOnlineUserId(userId)) return local;

  const remote = await apiJson<DayTrackerData>(
    `/api/day-tracker?userId=${encodeURIComponent(userId)}`
  );

  const merged = remote
    ? mergeDayTrackers(local, {
        user_id: remote.user_id || userId,
        completions: remote.completions ?? [],
        updated_at: remote.updated_at || new Date().toISOString(),
      })
    : local;

  saveDayTracker(userId, merged);
  await syncDayTrackerToDb(userId, merged);
  return merged;
}

export async function syncDayTrackerToDb(
  userId: string,
  data: DayTrackerData
): Promise<boolean> {
  if (!isOnlineUserId(userId)) return false;

  const payload = {
    userId,
    completions: data.completions,
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await apiJson<{ ok: boolean }>('/api/day-tracker', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result?.ok) return true;
  }

  console.warn('[day-tracker] Failed to save to MongoDB for user', userId);
  return false;
}

export { emptyDayTracker, loadDayTracker, saveDayTracker };
export type { DayTrackerData };

export async function loadLastMinPrepFromDb(userId: string): Promise<LastMinPrepProgress[]> {
  if (!isOnlineUserId(userId)) {
    return loadLastMinPrepProgress(userId);
  }

  // Remote is source of truth when online — never let another account's
  // leaked localStorage rows merge on top and re-upload.
  const remote = await apiJson<LastMinPrepProgress[]>(
    `/api/last-min-prep?userId=${encodeURIComponent(userId)}`
  );

  if (remote !== null) {
    const normalized = remote.map((row) => ({
      ...row,
      user_id: userId,
    }));
    saveLastMinPrepProgress(userId, normalized);
    return normalized;
  }

  return loadLastMinPrepProgress(userId);
}

export async function syncLastMinPrepToDb(
  userId: string,
  progress: LastMinPrepProgress[]
): Promise<boolean> {
  if (!isOnlineUserId(userId)) return false;
  const result = await apiJson<{ ok: boolean }>('/api/last-min-prep', {
    method: 'PUT',
    body: JSON.stringify({ userId, progress }),
  });
  return Boolean(result?.ok);
}

/** One-time wipe of leaked Last Min Prep / CP progress for harikiran. */
export async function purgeLeakedLastMinPrepForUser(
  username: string,
  userId: string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (username.trim().toLowerCase() !== 'harikiran') return false;

  const flagKey = `last_min_prep_leak_purged_v1_${userId}`;
  if (localStorage.getItem(flagKey) === '1') return false;

  saveLastMinPrepProgress(userId, []);
  localStorage.removeItem(`last_min_prep_${userId}`);
  const ok = !isOnlineUserId(userId) || (await syncLastMinPrepToDb(userId, []));
  if (ok) localStorage.setItem(flagKey, '1');
  return ok;
}

export async function loadLldFromDb(userId: string): Promise<LldProgress[]> {
  const local = loadLldProgress(userId);
  if (!isOnlineUserId(userId)) return local;

  const remote =
    (await apiJson<LldProgress[]>(
      `/api/lld?userId=${encodeURIComponent(userId)}`
    )) ?? [];

  const merged = mergeLldProgress(local, remote);
  saveLldProgress(userId, merged);
  await syncLldToDb(userId, merged);
  return merged;
}

export async function syncLldToDb(
  userId: string,
  progress: LldProgress[]
): Promise<boolean> {
  if (!isOnlineUserId(userId)) return false;
  const result = await apiJson<{ ok: boolean }>('/api/lld', {
    method: 'PUT',
    body: JSON.stringify({ userId, progress }),
  });
  return Boolean(result?.ok);
}

export async function loadAmazonPrepFromDb(userId: string): Promise<AmazonPrepProgress[]> {
  if (!isOnlineUserId(userId)) {
    return loadAmazonPrepProgress(userId);
  }

  const remote = await apiJson<AmazonPrepProgress[]>(
    `/api/amazon-prep?userId=${encodeURIComponent(userId)}`
  );

  if (remote !== null) {
    const normalized = remote.map((row) => ({
      ...row,
      user_id: userId,
    }));
    saveAmazonPrepProgress(userId, normalized);
    return normalized;
  }

  return loadAmazonPrepProgress(userId);
}

export async function syncAmazonPrepToDb(
  userId: string,
  progress: AmazonPrepProgress[]
): Promise<boolean> {
  if (!isOnlineUserId(userId)) return false;
  const result = await apiJson<{ ok: boolean }>('/api/amazon-prep', {
    method: 'PUT',
    body: JSON.stringify({ userId, progress }),
  });
  return Boolean(result?.ok);
}

export async function loadAmazonTweakFromDb(userId: string): Promise<AmazonTweakProgress[]> {
  if (!isOnlineUserId(userId)) {
    return loadAmazonTweakProgress(userId);
  }

  const remote = await apiJson<AmazonTweakProgress[]>(
    `/api/amazon-tweak-prep?userId=${encodeURIComponent(userId)}`
  );

  if (remote !== null) {
    const normalized = remote.map((row) => ({
      ...row,
      user_id: userId,
    }));
    saveAmazonTweakProgress(userId, normalized);
    return normalized;
  }

  return loadAmazonTweakProgress(userId);
}

export async function syncAmazonTweakToDb(
  userId: string,
  progress: AmazonTweakProgress[]
): Promise<boolean> {
  if (!isOnlineUserId(userId)) return false;
  const result = await apiJson<{ ok: boolean }>('/api/amazon-tweak-prep', {
    method: 'PUT',
    body: JSON.stringify({ userId, progress }),
  });
  return Boolean(result?.ok);
}

export async function loadGooglePrepFromDb(userId: string): Promise<GooglePrepProgress[]> {
  if (!isOnlineUserId(userId)) {
    return loadGooglePrepProgress(userId);
  }

  const remote = await apiJson<GooglePrepProgress[]>(
    `/api/google-prep?userId=${encodeURIComponent(userId)}`
  );

  if (remote !== null) {
    const normalized = remote.map((row) => ({
      ...row,
      user_id: userId,
    }));
    saveGooglePrepProgress(userId, normalized);
    return normalized;
  }

  return loadGooglePrepProgress(userId);
}

export async function syncGooglePrepToDb(
  userId: string,
  progress: GooglePrepProgress[]
): Promise<boolean> {
  if (!isOnlineUserId(userId)) return false;
  const result = await apiJson<{ ok: boolean }>('/api/google-prep', {
    method: 'PUT',
    body: JSON.stringify({ userId, progress }),
  });
  return Boolean(result?.ok);
}

export async function loadDesignPrepFromDb(userId: string): Promise<DesignPrepProgress[]> {
  if (!isOnlineUserId(userId)) {
    return loadDesignPrepProgress(userId);
  }

  const remote = await apiJson<DesignPrepProgress[]>(
    `/api/design-prep?userId=${encodeURIComponent(userId)}`
  );

  if (remote !== null) {
    const normalized = remote.map((row) => ({
      ...row,
      user_id: userId,
    }));
    saveDesignPrepProgress(userId, normalized);
    return normalized;
  }

  return loadDesignPrepProgress(userId);
}

export async function syncDesignPrepToDb(
  userId: string,
  progress: DesignPrepProgress[]
): Promise<boolean> {
  if (!isOnlineUserId(userId)) return false;
  const result = await apiJson<{ ok: boolean }>('/api/design-prep', {
    method: 'PUT',
    body: JSON.stringify({ userId, progress }),
  });
  return Boolean(result?.ok);
}

export async function loadGoalNotesFromDb(userId: string): Promise<GoalNote[]> {
  const local = loadGoalNotes(userId);
  if (!isOnlineUserId(userId)) return local;

  const remote =
    (await apiJson<GoalNote[]>(
      `/api/goal-notes?userId=${encodeURIComponent(userId)}`
    )) ?? [];
  const merged = mergeGoalNotes(local, remote);
  saveGoalNotes(userId, merged);
  return merged;
}

export async function syncGoalNotesToDb(
  userId: string,
  notes: GoalNote[]
): Promise<void> {
  if (!isOnlineUserId(userId)) return;
  await apiJson<{ ok: boolean }>('/api/goal-notes', {
    method: 'PUT',
    body: JSON.stringify({ userId, notes }),
  });
}

export function isOnlineUser(userId: string): boolean {
  return isOnlineUserId(userId);
}

export async function getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
  const result = await apiJson<LeaderboardEntry[]>(
    `/api/leaderboard?period=${encodeURIComponent(period)}`
  );
  return result ?? [];
}
