import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { User } from '@/lib/types';
import { ADMIN_USERNAME } from '@/lib/admin';

function toUser(doc: { _id: ObjectId; username: string; created_at: string }): User {
  return {
    id: doc._id.toString(),
    username: doc.username,
    created_at: doc.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const list = request.nextUrl.searchParams.get('list');
    const admin = request.nextUrl.searchParams.get('admin');

    if (list === '1') {
      if (admin !== ADMIN_USERNAME) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const db = await getDb();
      const docs = await db
        .collection('users')
        .find({})
        .sort({ created_at: -1 })
        .toArray();
      const users = docs.map((doc) =>
        toUser(doc as { _id: ObjectId; username: string; created_at: string })
      );
      return NextResponse.json(users);
    }

    const username = request.nextUrl.searchParams.get('username');
    if (!username) {
      return NextResponse.json({ error: 'username required' }, { status: 400 });
    }

    const db = await getDb();
    const doc = await db.collection('users').findOne({ username });
    if (!doc) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    return NextResponse.json(toUser(doc as { _id: ObjectId; username: string; created_at: string }));
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    if (!username) {
      return NextResponse.json({ error: 'username required' }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection('users');
    const existing = await users.findOne({ username });
    if (existing) {
      return NextResponse.json(toUser(existing as { _id: ObjectId; username: string; created_at: string }));
    }

    const created_at = new Date().toISOString();
    const result = await users.insertOne({ username, created_at });
    return NextResponse.json({
      id: result.insertedId.toString(),
      username,
      created_at,
    } satisfies User);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('POST /api/users error:', message);
    return NextResponse.json({ error: 'server error', detail: message }, { status: 500 });
  }
}
