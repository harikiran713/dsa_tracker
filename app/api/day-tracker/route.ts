import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

type CompletionInput = {
  day?: unknown;
  completed_at?: unknown;
};

function cleanCompletions(completions: CompletionInput[]) {
  const map = new Map<number, { day: number; completed_at: string }>();

  for (const item of completions) {
    const day = Number(item.day);
    if (!Number.isInteger(day) || day < 1 || day > 100) continue;
    const completed_at = String(item.completed_at ?? new Date().toISOString());
    const existing = map.get(day);
    if (!existing || completed_at > existing.completed_at) {
      map.set(day, { day, completed_at });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.day - b.day);
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const db = await getDb();
    const doc = await db.collection('day_tracker').findOne({ user_id: userId });

    if (!doc) {
      return NextResponse.json({
        user_id: userId,
        completions: [],
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      user_id: String(doc.user_id),
      completions: cleanCompletions(
        Array.isArray(doc.completions) ? (doc.completions as CompletionInput[]) : []
      ),
      updated_at: String(doc.updated_at ?? new Date().toISOString()),
    });
  } catch (error) {
    console.error('GET /api/day-tracker error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = String(body.userId ?? body.user_id ?? '');
    const completions = Array.isArray(body.completions) ? body.completions : [];

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const cleaned = cleanCompletions(completions);
    const updatedAt = new Date().toISOString();
    const db = await getDb();

    await db.collection('day_tracker').updateOne(
      { user_id: userId },
      {
        $set: {
          user_id: userId,
          completions: cleaned,
          completed_count: cleaned.length,
          updated_at: updatedAt,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      ok: true,
      user_id: userId,
      completed_count: cleaned.length,
      updated_at: updatedAt,
    });
  } catch (error) {
    console.error('PUT /api/day-tracker error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
