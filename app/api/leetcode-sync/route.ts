import { NextRequest, NextResponse } from 'next/server';

interface LeetCodeStatPair {
  status?: string;
  stat?: {
    frontend_question_id?: number;
    question_id?: number;
    question__title_slug?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '';

    if (!sessionToken) {
      return NextResponse.json({ error: 'sessionToken required' }, { status: 400 });
    }

    const res = await fetch('https://leetcode.com/api/problems/all/', {
      headers: {
        Cookie: `LEETCODE_SESSION=${sessionToken}`,
        Referer: 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (compatible; PrepTracker-Sync/1.0)',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `LeetCode returned an error (status ${res.status}).` },
        { status: 502 }
      );
    }

    const data = await res.json();
    if (!data.user_name) {
      return NextResponse.json(
        { error: 'That session cookie is invalid or expired — copy a fresh LEETCODE_SESSION value and try again.' },
        { status: 401 }
      );
    }

    const pairs: LeetCodeStatPair[] = Array.isArray(data.stat_status_pairs) ? data.stat_status_pairs : [];
    const solvedIds: number[] = [];
    const solvedSlugs: string[] = [];
    for (const p of pairs) {
      if (p.status !== 'ac') continue;
      const id = p.stat?.frontend_question_id ?? p.stat?.question_id;
      if (typeof id === 'number') solvedIds.push(id);
      if (typeof p.stat?.question__title_slug === 'string') solvedSlugs.push(p.stat.question__title_slug);
    }

    return NextResponse.json({
      solvedIds,
      solvedSlugs,
      totalSolved: solvedIds.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('POST /api/leetcode-sync error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
