import { supabase, User, UserProgress } from './supabase';
import { CompletionEvent, DailyTodoItem, loadCompletionEvents } from './activity';
import {
  LeaderboardEntry,
  LeaderboardPeriod,
  buildLeaderboard,
  getDifficultyScore,
  getLeaderboardPeriodStart,
} from './leaderboard';

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

// Fallback offline user storage
let offlineUsers: Map<string, User> = new Map();

async function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T | null> {
  try {
    const result = await Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
    return result;
  } catch {
    return null;
  }
}

// User Management
export async function getOrCreateUser(username: string): Promise<User | null> {
  try {
    // First try Supabase
    try {
      // Check if user exists
      const { data: existingUser, error: selectError } = await Promise.race([
        supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      if (!selectError) {
        return existingUser as User;
      }

      if (selectError && selectError.code !== 'PGRST116') {
        console.warn('Warning checking user in Supabase:', selectError.message);
      }

      // Try to create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ username }])
        .select()
        .single();

      if (!insertError) {
        return newUser as User;
      }
      
      console.warn('Could not insert user to Supabase, using offline mode');
    } catch (supabaseError) {
      console.log('[v0] Supabase offline, using local storage mode');
    }

    // Fallback: use offline storage
    if (offlineUsers.has(username)) {
      return offlineUsers.get(username)!;
    }

    const newUser: User = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      created_at: new Date().toISOString(),
    };

    offlineUsers.set(username, newUser);
    localStorage.setItem('offline_users', JSON.stringify(Array.from(offlineUsers.entries())));
    return newUser;
  } catch (error) {
    console.error('Unexpected error in getOrCreateUser:', error);
    return null;
  }
}

// Progress Management
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  try {
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .order('question_id', { ascending: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      if (!error) {
        return (data || []) as UserProgress[];
      }
    } catch (err) {
      console.log('[v0] Using offline progress storage');
    }

    // Fallback: get from localStorage
    const stored = localStorage.getItem(`progress_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Unexpected error in getUserProgress:', error);
    return [];
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
    const progressItem: UserProgress = {
      id: `${userId}-${questionId}`,
      user_id: userId,
      question_id: questionId,
      question_title: questionTitle,
      question_phase: questionPhase,
      status,
      notes,
      updated_at: new Date().toISOString(),
    };

    // Save to localStorage first (for immediate availability)
    const stored = localStorage.getItem(`progress_${userId}`);
    const progress = stored ? JSON.parse(stored) : [];
    const index = progress.findIndex((p: UserProgress) => p.question_id === questionId);
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

    // Try to sync with Supabase
    try {
      await Promise.race([
        supabase
          .from('user_progress')
          .upsert([progressItem], { onConflict: 'user_id,question_id' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    } catch (err) {
      console.log('[v0] Progress saved offline, will sync when connection available');
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
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching question progress:', error);
      return null;
    }

    return (data || null) as UserProgress | null;
  } catch (error) {
    console.error('Unexpected error in getQuestionProgress:', error);
    return null;
  }
}

export async function deleteUserProgress(userId: string, questionId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', questionId);

    if (error) {
      console.error('Error deleting progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in deleteUserProgress:', error);
    return false;
  }
}

export async function resetUserProgress(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in resetUserProgress:', error);
    return false;
  }
}

function isOnlineUserId(userId: string): boolean {
  return !userId.startsWith('offline-');
}

export async function syncCompletionEventToSupabase(event: CompletionEvent): Promise<void> {
  if (!isOnlineUserId(event.user_id)) return;
  const result = await withTimeout(
    supabase.from('completion_events').upsert(
      [{
        id: event.id,
        user_id: event.user_id,
        question_id: event.question_id,
        question_title: event.question_title,
        question_phase: event.question_phase,
        completed_at: event.completed_at,
      }],
      { onConflict: 'id' }
    ),
    5000
  );
  if (!result) {
    console.log('[v0] Completion event saved locally, will sync later');
  }
}

export async function syncCompletionEventsToSupabase(
  userId: string,
  events: CompletionEvent[]
): Promise<void> {
  if (!isOnlineUserId(userId) || events.length === 0) return;
  try {
    const rows = events.map((e) => ({
      id: e.id,
      user_id: e.user_id,
      question_id: e.question_id,
      question_title: e.question_title,
      question_phase: e.question_phase,
      completed_at: e.completed_at,
    }));
    const result = await withTimeout(
      supabase.from('completion_events').upsert(rows, { onConflict: 'id' }),
      8000
    );
    if (!result) console.log('[v0] Bulk completion sync skipped');
  } catch {
    console.log('[v0] Bulk completion sync skipped');
  }
}

export async function syncDailyTodosToSupabase(
  userId: string,
  todos: DailyTodoItem[]
): Promise<void> {
  if (!isOnlineUserId(userId)) return;
  const deleteResult = await withTimeout(
    supabase.from('daily_todos').delete().eq('user_id', userId),
    5000
  );
  if (!deleteResult) {
    console.log('[v0] Daily todos sync skipped');
    return;
  }
  if (todos.length === 0) return;
  const rows = todos.map((t) => ({
    id: t.id,
    user_id: t.user_id,
    date: t.date,
    text: t.text,
    done: t.done,
    question_id: t.question_id ?? null,
    created_at: t.created_at,
  }));
  const upsertResult = await withTimeout(
    supabase.from('daily_todos').upsert(rows, { onConflict: 'id' }),
    8000
  );
  if (!upsertResult) console.log('[v0] Daily todos sync skipped');
}

function countByUser(rows: { user_id: string }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1);
  }
  return map;
}

function scoreByUser(
  rows: { user_id: string; question_phase?: string | null }[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const pts = getDifficultyScore(row.question_phase);
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + pts);
  }
  return map;
}

export async function getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
  const start = getLeaderboardPeriodStart(period);
  const startIso = start.toISOString();
  const startDate = start.toISOString().slice(0, 10);

  const usersResult = await withTimeout(
    supabase.from('users').select('id, username'),
    8000
  );
  if (!usersResult || usersResult.error) return [];

  const users = usersResult.data ?? [];
  if (users.length === 0) return [];

  let scores = new Map<string, number>();
  let problemCounts = new Map<string, number>();

  const eventsResult = await withTimeout(
    supabase
      .from('completion_events')
      .select('user_id, question_phase')
      .gte('completed_at', startIso),
    8000
  );

  if (eventsResult && !eventsResult.error && eventsResult.data) {
    scores = scoreByUser(eventsResult.data);
    problemCounts = countByUser(eventsResult.data);
  } else {
    const progressResult = await withTimeout(
      supabase
        .from('user_progress')
        .select('user_id, question_phase')
        .eq('status', 'done')
        .gte('updated_at', startIso),
      8000
    );
    if (progressResult?.data) {
      scores = scoreByUser(progressResult.data);
      problemCounts = countByUser(progressResult.data);
    }
  }

  let todoCounts = new Map<string, number>();
  const todosResult = await withTimeout(
    supabase
      .from('daily_todos')
      .select('user_id')
      .eq('done', true)
      .gte('date', startDate),
    8000
  );
  if (todosResult && !todosResult.error && todosResult.data) {
    todoCounts = countByUser(todosResult.data);
  }

  return buildLeaderboard(users, scores, problemCounts, todoCounts);
}
