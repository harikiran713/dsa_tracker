export type StatsPeriod = 'today' | '7d' | '30d' | '60d' | '90d' | 'all';

export interface CompletionEvent {
  id: string;
  user_id: string;
  question_id: number;
  question_title: string;
  question_phase: 'Easy' | 'Medium' | 'Hard';
  completed_at: string;
}

export interface DailyTodoItem {
  id: string;
  user_id: string;
  date: string;
  text: string;
  done: boolean;
  question_id?: number;
  question_title?: string;
  question_phase?: 'Easy' | 'Medium' | 'Hard';
  created_at: string;
}

export interface PeriodStats {
  completed: number;
  revised: number;
  todosDone: number;
  todosTotal: number;
  byDay: { date: string; label: string; count: number }[];
  byDifficulty: { Easy: number; Medium: number; Hard: number };
}

export const STATS_PERIOD_LABELS: Record<StatsPeriod, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '60d': 'Last 60 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function getPeriodStart(period: StatsPeriod, now = new Date()): Date | null {
  if (period === 'all') return null;
  const start = startOfDay(now);
  if (period === 'today') return start;
  const days = { '7d': 6, '30d': 29, '60d': 59, '90d': 89 }[period];
  start.setDate(start.getDate() - days);
  return start;
}

export function isInPeriod(isoDate: string, period: StatsPeriod, now = new Date()): boolean {
  if (period === 'all') return true;
  const d = new Date(isoDate);
  const start = getPeriodStart(period, now);
  if (!start) return true;
  return d >= start && d <= now;
}

export function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function toDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function computePeriodStats(
  events: CompletionEvent[],
  todos: DailyTodoItem[],
  period: StatsPeriod,
  reviseEvents: { updated_at: string }[] = []
): PeriodStats {
  const filtered = events.filter((e) => isInPeriod(e.completed_at, period));
  const filteredTodos = todos.filter((t) => isInPeriod(t.date + 'T12:00:00', period));
  const filteredRevise = reviseEvents.filter((e) => isInPeriod(e.updated_at, period));

  const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  for (const e of filtered) {
    if (e.question_phase in byDifficulty) {
      byDifficulty[e.question_phase as keyof typeof byDifficulty]++;
    }
  }

  const dayMap = new Map<string, number>();
  for (const e of filtered) {
    const key = e.completed_at.slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }

  const byDay = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, label: formatDayLabel(date), count }));

  return {
    completed: filtered.length,
    revised: filteredRevise.length,
    todosDone: filteredTodos.filter((t) => t.done).length,
    todosTotal: filteredTodos.length,
    byDay,
    byDifficulty,
  };
}

// --- localStorage helpers ---

export function loadCompletionEvents(userId: string): CompletionEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(`completion_events_${userId}`) || '[]');
  } catch {
    return [];
  }
}

export function saveCompletionEvents(userId: string, events: CompletionEvent[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`completion_events_${userId}`, JSON.stringify(events));
}

export function logCompletionEvent(
  userId: string,
  questionId: number,
  title: string,
  phase: 'Easy' | 'Medium' | 'Hard'
): CompletionEvent {
  const event: CompletionEvent = {
    id: `${userId}-${questionId}-${Date.now()}`,
    user_id: userId,
    question_id: questionId,
    question_title: title,
    question_phase: phase,
    completed_at: new Date().toISOString(),
  };
  const events = loadCompletionEvents(userId);
  events.push(event);
  saveCompletionEvents(userId, events);
  return event;
}

export function loadDailyTodos(userId: string): DailyTodoItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(`daily_todos_${userId}`) || '[]');
  } catch {
    return [];
  }
}

export function saveDailyTodos(userId: string, todos: DailyTodoItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`daily_todos_${userId}`, JSON.stringify(todos));
}

export function getTodosForDate(todos: DailyTodoItem[], date: string): DailyTodoItem[] {
  return todos.filter((t) => t.date === date).sort((a, b) => a.created_at.localeCompare(b.created_at));
}
