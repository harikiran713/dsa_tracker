import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { UserProgress } from '@/lib/types';

function toProgress(doc: Record<string, unknown>): UserProgress {
  const userId = String(doc.user_id);
  const questionId = Number(doc.question_id);
  return {
    id: `${userId}-${questionId}`,
    user_id: userId,
    question_id: questionId,
    question_title: doc.question_title as string | undefined,
    question_phase: doc.question_phase as string | undefined,
    status: doc.status as UserProgress['status'],
    notes: String(doc.notes ?? ''),
    updated_at: String(doc.updated_at),
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const db = await getDb();
    const docs = await db
      .collection('user_progress')
      .find({ user_id: userId })
      .sort({ question_id: 1 })
      .toArray();

    return NextResponse.json(docs.map(toProgress));
  } catch (error) {
    console.error('GET /api/progress error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: Record<string, unknown>[] = Array.isArray(body.items) ? body.items : [body];

    if (items.length === 0) {
      return NextResponse.json({ error: 'no items' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('user_progress');

    for (const item of items) {
      const userId = String(item.user_id);
      const questionId = Number(item.question_id);
      if (!userId || Number.isNaN(questionId)) continue;

      await collection.updateOne(
        { user_id: userId, question_id: questionId },
        {
          $set: {
            user_id: userId,
            question_id: questionId,
            question_title: item.question_title ?? '',
            question_phase: item.question_phase ?? 'Easy',
            status: item.status ?? 'todo',
            notes: item.notes ?? '',
            updated_at: item.updated_at ?? new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/progress error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const questionId = request.nextUrl.searchParams.get('questionId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const db = await getDb();
    if (questionId) {
      await db.collection('user_progress').deleteOne({
        user_id: userId,
        question_id: Number(questionId),
      });
    } else {
      await db.collection('user_progress').deleteMany({ user_id: userId });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/progress error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
