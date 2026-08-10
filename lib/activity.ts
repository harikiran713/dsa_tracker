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

export function completionEventId(userId: string, questionId: number): string {
  return `${userId}-q-${questionId}`;
}

/** Keep only the latest completion per question. */
export function dedupeCompletionEvents(events: CompletionEvent[]): CompletionEvent[] {
  const map = new Map<number, CompletionEvent>();
  for (const e of events) {
    const existing = map.get(e.question_id);
    if (!existing || new Date(e.completed_at) >= new Date(existing.completed_at)) {
      map.set(e.question_id, e);
    }
  }
  return [...map.values()].sort((a, b) => b.completed_at.localeCompare(a.completed_at));
}

export function computePeriodStats(
  events: CompletionEvent[],
  todos: DailyTodoItem[],
  period: StatsPeriod,
  reviseEvents: { updated_at: string }[] = []
): PeriodStats {
  const deduped = dedupeCompletionEvents(events);
  const filtered = deduped.filter((e) => isInPeriod(e.completed_at, period));
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
    const raw: CompletionEvent[] = JSON.parse(
      localStorage.getItem(`completion_events_${userId}`) || '[]'
    );
    return dedupeCompletionEvents(raw);
  } catch {
    return [];
  }
}

export function saveCompletionEvents(userId: string, events: CompletionEvent[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    `completion_events_${userId}`,
    JSON.stringify(dedupeCompletionEvents(events))
  );
}

export function logCompletionEvent(
  userId: string,
  questionId: number,
  title: string,
  phase: 'Easy' | 'Medium' | 'Hard'
): CompletionEvent {
  const event: CompletionEvent = {
    id: completionEventId(userId, questionId),
    user_id: userId,
    question_id: questionId,
    question_title: title,
    question_phase: phase,
    completed_at: new Date().toISOString(),
  };
  const events = loadCompletionEvents(userId).filter((e) => e.question_id !== questionId);
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

export interface HeatmapDay {
  date: string;
  count: number;
  /** 0 empty … 4 hottest */
  level: number;
}

export interface ActivityHeatmapData {
  /** weeks × 7 days (Sun→Sat), oldest week first */
  weeks: HeatmapDay[][];
  total: number;
  activeDays: number;
  bestStreak: number;
  currentStreak: number;
  monthLabels: { weekIndex: number; label: string }[];
}

function dateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function levelFromCount(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

/** GitHub-style contribution heatmap for the last ~52 weeks. */
export function buildActivityHeatmap(
  events: CompletionEvent[],
  now = new Date()
): ActivityHeatmapData {
  const counts = new Map<string, number>();
  for (const e of dedupeCompletionEvents(events)) {
    const key = e.completed_at.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const end = startOfDay(now);
  // Align end to end of current week (Saturday) like GitHub (Sun-start weeks)
  const endDow = end.getDay(); // 0 Sun … 6 Sat
  const gridEnd = new Date(end);
  gridEnd.setDate(gridEnd.getDate() + (6 - endDow));

  const weeksCount = 53;
  const totalDays = weeksCount * 7;
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridStart.getDate() - (totalDays - 1));

  const weeks: HeatmapDay[][] = [];
  const monthLabels: { weekIndex: number; label: string }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < weeksCount; w++) {
    const week: HeatmapDay[] = [];
    for (let dow = 0; dow < 7; dow++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + w * 7 + dow);
      const key = dateKeyLocal(d);
      const count = d > end ? 0 : counts.get(key) ?? 0;
      week.push({
        date: key,
        count: d > end ? 0 : count,
        level: d > end ? 0 : levelFromCount(count),
      });
      if (dow === 0) {
        const month = d.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({
            weekIndex: w,
            label: d.toLocaleDateString('en-US', { month: 'short' }),
          });
          lastMonth = month;
        }
      }
    }
    weeks.push(week);
  }

  let total = 0;
  let activeDays = 0;
  const allDays = weeks.flat().filter((d) => d.date <= dateKeyLocal(end));
  for (const day of allDays) {
    total += day.count;
    if (day.count > 0) activeDays++;
  }

  // Streaks (calendar days with ≥1 completion)
  let currentStreak = 0;
  let bestStreak = 0;
  let run = 0;
  // current streak: consecutive days ending today (or yesterday if today empty)
  let streakCursor = new Date(end);
  if ((counts.get(dateKeyLocal(streakCursor)) ?? 0) === 0) {
    streakCursor.setDate(streakCursor.getDate() - 1);
  }
  while ((counts.get(dateKeyLocal(streakCursor)) ?? 0) > 0) {
    currentStreak++;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }

  // best streak over full range
  const sortedKeys = [...counts.keys()].sort();
  let prev: string | null = null;
  for (const key of sortedKeys) {
    if ((counts.get(key) ?? 0) <= 0) continue;
    if (prev) {
      const prevD = new Date(prev + 'T12:00:00');
      const curD = new Date(key + 'T12:00:00');
      const diff = Math.round((curD.getTime() - prevD.getTime()) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    bestStreak = Math.max(bestStreak, run);
    prev = key;
  }

  return { weeks, total, activeDays, bestStreak, currentStreak, monthLabels };
}
