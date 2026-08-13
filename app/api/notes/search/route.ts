import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export type NoteSearchSource = 'problems' | 'lastmin' | 'lld';

export interface NoteSearchHit {
  source: NoteSearchSource;
  user_id: string;
  /** Problem number, leetcode id, or LLD topic id */
  ref_id: string;
  title: string;
  status: string;
  notes: string;
  snippet: string;
  updated_at: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function makeSnippet(notes: string, query: string, radius = 80): string {
  const text = notes.replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) {
    return text.length > radius * 2 ? `${text.slice(0, radius * 2)}…` : text;
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')?.trim() ?? '';
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    const sourceParam = request.nextUrl.searchParams.get('source')?.trim() ?? 'all';
    const limitRaw = Number(request.nextUrl.searchParams.get('limit') ?? '50');
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    if (q.length < 2) {
      return NextResponse.json({ error: 'q must be at least 2 characters' }, { status: 400 });
    }

    const sources: NoteSearchSource[] =
      sourceParam === 'problems' || sourceParam === 'lastmin' || sourceParam === 'lld'
        ? [sourceParam]
        : ['problems', 'lastmin', 'lld'];

    const db = await getDb();
    const regex = new RegExp(escapeRegex(q), 'i');
    const hits: NoteSearchHit[] = [];

    async function findNotes(
      collection: string,
      filterExtra: Record<string, unknown> = {}
    ) {
      const base = {
        user_id: userId,
        notes: { $ne: '' },
        ...filterExtra,
      };

      // Prefer MongoDB text index; fall back to case-insensitive regex.
      try {
        const textDocs = await db
          .collection(collection)
          .find({ ...base, $text: { $search: q } })
          .project({ score: { $meta: 'textScore' }, user_id: 1, notes: 1, status: 1, updated_at: 1, question_id: 1, question_title: 1, leetcode_id: 1, topic_id: 1 })
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit)
          .toArray();
        if (textDocs.length > 0) return textDocs;
      } catch {
        // text index may not exist yet
      }

      return db
        .collection(collection)
        .find({ ...base, notes: { $regex: regex } })
        .project({
          user_id: 1,
          notes: 1,
          status: 1,
          updated_at: 1,
          question_id: 1,
          question_title: 1,
          leetcode_id: 1,
          topic_id: 1,
        })
        .sort({ updated_at: -1 })
        .limit(limit)
        .toArray();
    }

    if (sources.includes('problems')) {
      const docs = await findNotes('user_progress');
      for (const d of docs) {
        const notes = String(d.notes ?? '');
        hits.push({
          source: 'problems',
          user_id: String(d.user_id),
          ref_id: String(d.question_id),
          title: String(d.question_title || `Problem #${d.question_id}`),
          status: String(d.status ?? 'todo'),
          notes,
          snippet: makeSnippet(notes, q),
          updated_at: String(d.updated_at ?? ''),
        });
      }
    }

    if (sources.includes('lastmin')) {
      const docs = await findNotes('last_min_prep_progress');
      for (const d of docs) {
        const notes = String(d.notes ?? '');
        hits.push({
          source: 'lastmin',
          user_id: String(d.user_id),
          ref_id: String(d.leetcode_id),
          title: `LC ${d.leetcode_id}`,
          status: String(d.status ?? 'todo'),
          notes,
          snippet: makeSnippet(notes, q),
          updated_at: String(d.updated_at ?? ''),
        });
      }
    }

    if (sources.includes('lld')) {
      const docs = await findNotes('lld_progress');
      for (const d of docs) {
        const notes = String(d.notes ?? '');
        const topicId = String(d.topic_id ?? '');
        hits.push({
          source: 'lld',
          user_id: String(d.user_id),
          ref_id: topicId,
          title: topicId
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          status: String(d.status ?? 'todo'),
          notes,
          snippet: makeSnippet(notes, q),
          updated_at: String(d.updated_at ?? ''),
        });
      }
    }

    hits.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    const results = hits.slice(0, limit);

    return NextResponse.json({
      q,
      userId,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('GET /api/notes/search error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
