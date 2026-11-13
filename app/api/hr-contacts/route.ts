import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { isOwnerUsername } from '@/lib/owner';

function toContact(doc: Record<string, unknown>) {
  return {
    id: String(doc.id),
    user_id: String(doc.user_id),
    name: String(doc.name ?? ''),
    linkedin: String(doc.linkedin ?? ''),
    phones: Array.isArray(doc.phones) ? doc.phones.map(String) : [],
    emails: Array.isArray(doc.emails) ? doc.emails.map(String) : [],
    role: String(doc.role ?? ''),
    company: String(doc.company ?? ''),
    created_at: String(doc.created_at ?? new Date().toISOString()),
    updated_at: String(doc.updated_at ?? new Date().toISOString()),
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const owner = request.nextUrl.searchParams.get('owner');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    if (!isOwnerUsername(owner ?? '')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const db = await getDb();
    const docs = await db.collection('hr_contacts').find({ user_id: userId }).toArray();

    return NextResponse.json(docs.map(toContact));
  } catch (error) {
    console.error('GET /api/hr-contacts error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = String(body.userId ?? '');
    const owner = String(body.owner ?? '');
    const contacts = Array.isArray(body.contacts) ? body.contacts : [];

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    if (!isOwnerUsername(owner)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const db = await getDb();
    const collection = db.collection('hr_contacts');
    await collection.deleteMany({ user_id: userId });

    if (contacts.length > 0) {
      await collection.insertMany(
        contacts.map((c: Record<string, unknown>) => ({
          id: String(c.id),
          user_id: userId,
          name: String(c.name ?? ''),
          linkedin: String(c.linkedin ?? ''),
          phones: Array.isArray(c.phones) ? c.phones.map(String) : [],
          emails: Array.isArray(c.emails) ? c.emails.map(String) : [],
          role: String(c.role ?? ''),
          company: String(c.company ?? ''),
          created_at: c.created_at ?? new Date().toISOString(),
          updated_at: c.updated_at ?? new Date().toISOString(),
        }))
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PUT /api/hr-contacts error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
