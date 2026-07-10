import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events = Array.isArray(body.events) ? body.events : [body.event ?? body];
    if (events.length === 0) {
      return NextResponse.json({ error: 'no events' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('completion_events');

    for (const event of events) {
      if (!event?.user_id || event.question_id == null) continue;
      const id = event.id || `${event.user_id}-q-${event.question_id}`;
      await collection.updateOne(
        { user_id: String(event.user_id), question_id: Number(event.question_id) },
        {
          $set: {
            id,
            user_id: String(event.user_id),
            question_id: Number(event.question_id),
            question_title: event.question_title ?? '',
            question_phase: event.question_phase ?? 'Easy',
            completed_at: event.completed_at ?? new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/completion-events error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
