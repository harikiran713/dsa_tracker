import { User, UserProgress } from './types';
import { CompletionEvent, DailyTodoItem, loadCompletionEvents, loadDailyTodos, saveDailyTodos } from './activity';
import {
  LeaderboardEntry,
  LeaderboardPeriod,
} from './leaderboard';

export type { User, UserProgress };

const USER_CACHE_KEY = 'interview_prep_user_cache';

function logCompletionEvent(
  userId: string,
  questionId: number,
  questionTitle: string,
  questionPhase: string
): CompletionEvent {
  const event: CompletionEvent = {
    id: `${userId}-${questionId}-${Date.now()}`,
    user_id: userId,
    question_id: questionId,
    question_title: questionTitle,
    question_phase: questionPhase as 'Easy' | 'Medium' | 'Hard',
    completed_at: new Date().toISOString(),
  };
  const events = loadCompletionEvents(userId);
  events.push(event);
  if (typeof window !== 'undefined') {
    localStorage.setItem(`completion_events_${userId}`, JSON.stringify(events));
  }
  return event;
}

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

function migrateLocalUserData(oldUserId: string, newUserId: string): void {
  if (!oldUserId || oldUserId === newUserId || typeof window === 'undefined') return;

  for (const prefix of ['progress_', 'completion_events_', 'daily_todos_']) {
    const oldKey = `${prefix}${oldUserId}`;
    const newKey = `${prefix}${newUserId}`;
    const oldData = localStorage.getItem(oldKey);
    if (!oldData) continue;

    const existing = localStorage.getItem(newKey);
    if (!existing) {
      localStorage.setItem(newKey, oldData);
    } else if (prefix === 'progress_') {
      try {
        const merged = mergeProgress(JSON.parse(oldData), JSON.parse(existing));
        localStorage.setItem(newKey, JSON.stringify(merged));
      } catch {
        // keep existing
      }
    }
    localStorage.removeItem(oldKey);
  }
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
      const text = await res.text().catch(() => '');
      console.warn(`[api] ${options?.method ?? 'GET'} ${url} failed: ${res.status}`, text);
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

export async function getOrCreateUser(username: string): Promise<User | null> {
  try {
    const previousId =
      typeof window !== 'undefined' ? localStorage.getItem('interview_prep_user_id') : null;

    const user = await apiJson<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });

    if (user) {
      if (previousId && previousId !== user.id) {
        migrateLocalUserData(previousId, user.id);
      }
      saveUserToCache(user);
      return user;
    }

    const cached = getCachedUser(username);
    if (cached) return cached;

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

export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  try {
    const stored = localStorage.getItem(`progress_${userId}`);
    const localProgress: UserProgress[] = stored ? JSON.parse(stored) : [];

    const remoteProgress =
      (await apiJson<UserProgress[]>(`/api/progress?userId=${encodeURIComponent(userId)}`)) ?? [];

    const merged = mergeProgress(localProgress, remoteProgress);

    localStorage.setItem(`progress_${userId}`, JSON.stringify(merged));

    if (isOnlineUserId(userId) && merged.length > 0) {
      void syncProgressBatchToSupabase(userId, merged);
    }

    return merged;
  } catch (error) {
    console.error('Unexpected error in getUserProgress:', error);
    const stored = localStorage.getItem(`progress_${userId}`);
    return stored ? JSON.parse(stored) : [];
  }
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

export async function getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
  const result = await apiJson<LeaderboardEntry[]>(
    `/api/leaderboard?period=${encodeURIComponent(period)}`
  );
  return result ?? [];
}
