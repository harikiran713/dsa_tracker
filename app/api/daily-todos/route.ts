import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const db = await getDb();
    const docs = await db.collection('daily_todos').find({ user_id: userId }).toArray();

    return NextResponse.json(
      docs.map((t) => ({
        id: String(t.id),
        user_id: String(t.user_id),
        date: String(t.date),
        text: String(t.text),
        done: Boolean(t.done),
        question_id: t.question_id ?? undefined,
        question_title: t.question_title ?? undefined,
        question_phase: t.question_phase ?? undefined,
        created_at: String(t.created_at),
      }))
    );
  } catch (error) {
    console.error('GET /api/daily-todos error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = String(body.userId ?? '');
    const todos = Array.isArray(body.todos) ? body.todos : [];

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('daily_todos');
    await collection.deleteMany({ user_id: userId });

    if (todos.length > 0) {
      await collection.insertMany(
        todos.map((t: Record<string, unknown>) => ({
          id: String(t.id),
          user_id: userId,
          date: String(t.date),
          text: String(t.text),
          done: Boolean(t.done),
          question_id: t.question_id ?? null,
          question_title: t.question_title ?? null,
          question_phase: t.question_phase ?? null,
          created_at: t.created_at ?? new Date().toISOString(),
        }))
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PUT /api/daily-todos error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
