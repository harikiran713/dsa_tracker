import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import {
  LeaderboardPeriod,
  buildLeaderboard,
  getDifficultyScore,
  getLeaderboardPeriodStart,
} from '@/lib/leaderboard';

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

export async function GET(request: NextRequest) {
  try {
    const period = (request.nextUrl.searchParams.get('period') ?? 'day') as LeaderboardPeriod;
    const start = getLeaderboardPeriodStart(period);
    const startIso = start.toISOString();
    const startDate = start.toISOString().slice(0, 10);

    const db = await getDb();

    const userDocs = await db.collection('users').find({}).toArray();
    const users = userDocs.map((u) => ({
      id: u._id.toString(),
      username: String(u.username),
    }));

    if (users.length === 0) {
      return NextResponse.json([]);
    }

    let scores = new Map<string, number>();
    let problemCounts = new Map<string, number>();

    const events = await db
      .collection('completion_events')
      .find({ completed_at: { $gte: startIso } })
      .project({ user_id: 1, question_phase: 1 })
      .toArray();

    if (events.length > 0) {
      const rows = events.map((e) => ({
        user_id: String(e.user_id),
        question_phase: e.question_phase as string | undefined,
      }));
      scores = scoreByUser(rows);
      problemCounts = countByUser(rows);
    } else {
      const progress = await db
        .collection('user_progress')
        .find({ status: 'done', updated_at: { $gte: startIso } })
        .project({ user_id: 1, question_phase: 1 })
        .toArray();

      const rows = progress.map((p) => ({
        user_id: String(p.user_id),
        question_phase: p.question_phase as string | undefined,
      }));
      scores = scoreByUser(rows);
      problemCounts = countByUser(rows);
    }

    const todos = await db
      .collection('daily_todos')
      .find({ done: true, date: { $gte: startDate } })
      .project({ user_id: 1 })
      .toArray();

    const todoCounts = countByUser(
      todos.map((t) => ({ user_id: String(t.user_id) }))
    );

    return NextResponse.json(buildLeaderboard(users, scores, problemCounts, todoCounts));
  } catch (error) {
    console.error('GET /api/leaderboard error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
