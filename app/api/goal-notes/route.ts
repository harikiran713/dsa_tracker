import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const db = await getDb();
    const docs = await db.collection('goal_notes').find({ user_id: userId }).toArray();

    return NextResponse.json(
      docs.map((n) => ({
        id: String(n.id),
        user_id: String(n.user_id),
        title: String(n.title ?? ''),
        text: String(n.text ?? ''),
        created_at: String(n.created_at ?? new Date().toISOString()),
        updated_at: String(n.updated_at ?? new Date().toISOString()),
      }))
    );
  } catch (error) {
    console.error('GET /api/goal-notes error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = String(body.userId ?? '');
    const notes = Array.isArray(body.notes) ? body.notes : [];

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('goal_notes');
    await collection.deleteMany({ user_id: userId });

    if (notes.length > 0) {
      await collection.insertMany(
        notes.map((n: Record<string, unknown>) => ({
          id: String(n.id),
          user_id: userId,
          title: String(n.title ?? ''),
          text: String(n.text ?? ''),
          created_at: n.created_at ?? new Date().toISOString(),
          updated_at: n.updated_at ?? new Date().toISOString(),
        }))
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PUT /api/goal-notes error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
