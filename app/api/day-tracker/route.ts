import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

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
      completions: Array.isArray(doc.completions)
        ? doc.completions.map((c: { day: number; completed_at: string }) => ({
            day: Number(c.day),
            completed_at: String(c.completed_at),
          }))
        : [],
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
    const userId = String(body.userId ?? '');
    const completions = Array.isArray(body.completions) ? body.completions : [];

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const cleaned = completions
      .map((c: { day?: unknown; completed_at?: unknown }) => ({
        day: Number(c.day),
        completed_at: String(c.completed_at ?? new Date().toISOString()),
      }))
      .filter(
        (c: { day: number }) =>
          Number.isInteger(c.day) && c.day >= 1 && c.day <= 100
      );

    const updatedAt = new Date().toISOString();
    const db = await getDb();
    await db.collection('day_tracker').updateOne(
      { user_id: userId },
      {
        $set: {
          user_id: userId,
          completions: cleaned,
          updated_at: updatedAt,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, updated_at: updatedAt });
  } catch (error) {
    console.error('PUT /api/day-tracker error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
