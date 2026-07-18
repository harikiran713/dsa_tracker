import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const db = await getDb();
    const docs = await db
      .collection('last_min_prep_progress')
      .find({ user_id: userId })
      .toArray();

    return NextResponse.json(
      docs.map((d) => ({
        leetcode_id: Number(d.leetcode_id),
        user_id: String(d.user_id),
        status: (d.status as string) || 'todo',
        notes: String(d.notes ?? ''),
        updated_at: String(d.updated_at ?? new Date().toISOString()),
      }))
    );
  } catch (error) {
    console.error('GET /api/last-min-prep error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = String(body.userId ?? '');
    const rows = Array.isArray(body.progress) ? body.progress : [];

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('last_min_prep_progress');
    await collection.deleteMany({ user_id: userId });

    if (rows.length > 0) {
      await collection.insertMany(
        rows.map((r: Record<string, unknown>) => ({
          user_id: userId,
          leetcode_id: Number(r.leetcode_id),
          status: String(r.status ?? 'todo'),
          notes: String(r.notes ?? ''),
          updated_at: String(r.updated_at ?? new Date().toISOString()),
        }))
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PUT /api/last-min-prep error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
