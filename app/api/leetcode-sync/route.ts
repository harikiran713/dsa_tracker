import { NextRequest, NextResponse } from 'next/server';

interface LeetCodeStatPair {
  stat?: {
    frontend_question_id?: number;
    question_id?: number;
    question__title_slug?: string;
  };
  status?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = String(body.session ?? '').trim();

    if (!session) {
      return NextResponse.json({ error: 'LeetCode session cookie is required' }, { status: 400 });
    }

    const res = await fetch('https://leetcode.com/api/problems/all/', {
      headers: {
        Cookie: `LEETCODE_SESSION=${session}`,
        'User-Agent': 'Mozilla/5.0 (compatible; interview-prep-tracker)',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `LeetCode responded with ${res.status}. Your session cookie may be invalid or expired.` },
        { status: 502 }
      );
    }

    const data = await res.json();

    // An invalid/expired cookie doesn't 401 here — LeetCode just falls back to
    // an anonymous response with an empty user_name and status:null everywhere.
    if (!data?.user_name) {
      return NextResponse.json(
        { error: 'LeetCode did not recognize that session cookie. It may be invalid or expired — grab a fresh one and try again.' },
        { status: 401 }
      );
    }

    const pairs: LeetCodeStatPair[] = Array.isArray(data?.stat_status_pairs)
      ? data.stat_status_pairs
      : [];

    const solvedIds: number[] = [];
    const solvedSlugs: string[] = [];

    for (const pair of pairs) {
      if (pair?.status !== 'ac') continue;
      const id = pair.stat?.frontend_question_id ?? pair.stat?.question_id;
      if (typeof id === 'number') solvedIds.push(id);
      const slug = pair.stat?.question__title_slug;
      if (typeof slug === 'string' && slug) solvedSlugs.push(slug);
    }

    return NextResponse.json({
      solvedIds,
      solvedSlugs,
      totalSolved: solvedIds.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('POST /api/leetcode-sync error:', error);
    return NextResponse.json({ error: 'Failed to sync with LeetCode' }, { status: 500 });
  }
}
