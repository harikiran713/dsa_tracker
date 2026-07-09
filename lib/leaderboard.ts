export type LeaderboardPeriod = 'day' | 'week' | 'month';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export const DIFFICULTY_SCORES: Record<Difficulty, number> = {
  Easy: 2,
  Medium: 4,
  Hard: 6,
};

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  problemsCompleted: number;
  todosCompleted: number;
}

export const LEADERBOARD_PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  day: 'Today',
  week: 'This Week',
  month: 'This Month',
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function getLeaderboardPeriodStart(period: LeaderboardPeriod, now = new Date()): Date {
  if (period === 'day') return startOfDay(now);

  if (period === 'week') {
    const start = startOfDay(now);
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    return start;
  }

  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function getDifficultyScore(phase: string | null | undefined): number {
  if (phase === 'Medium') return DIFFICULTY_SCORES.Medium;
  if (phase === 'Hard') return DIFFICULTY_SCORES.Hard;
  return DIFFICULTY_SCORES.Easy;
}

export function buildLeaderboard(
  users: { id: string; username: string }[],
  scores: Map<string, number>,
  problemCounts: Map<string, number>,
  todoCounts: Map<string, number>
): LeaderboardEntry[] {
  const entries = users
    .map((user) => ({
      user_id: user.id,
      username: user.username,
      score: scores.get(user.id) ?? 0,
      problemsCompleted: problemCounts.get(user.id) ?? 0,
      todosCompleted: todoCounts.get(user.id) ?? 0,
    }))
    .filter((e) => e.score > 0 || e.todosCompleted > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.problemsCompleted !== a.problemsCompleted) {
        return b.problemsCompleted - a.problemsCompleted;
      }
      return b.todosCompleted - a.todosCompleted;
    });

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
