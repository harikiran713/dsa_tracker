import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import {
  ADMIN_USERNAME,
  AdminAuditAction,
  AdminAuditEntry,
  AdminLeakPair,
  AdminOverview,
  AdminResetScope,
  AdminUserDetail,
  AdminUserRow,
  assertAdminAccess,
} from '@/lib/admin';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const INACTIVE_MS = 14 * 24 * 60 * 60 * 1000;
const LEAK_MIN_DONE = 15;
const LEAK_SIMILARITY = 0.75;

function maxIso(dates: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  for (const d of dates) {
    if (!d) continue;
    if (!best || d > best) best = d;
  }
  return best;
}

async function writeAudit(
  db: Awaited<ReturnType<typeof getDb>>,
  entry: Omit<AdminAuditEntry, 'id'>
): Promise<void> {
  const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.collection('admin_audit').insertOne({ ...entry, id });
}

function authFrom(request: NextRequest, body?: Record<string, unknown>) {
  const admin =
    request.nextUrl.searchParams.get('admin') ??
    (typeof body?.admin === 'string' ? body.admin : null);
  const pin =
    request.nextUrl.searchParams.get('pin') ??
    (typeof body?.pin === 'string' ? body.pin : null);
  return { admin, pin };
}

async function buildOverview(db: Awaited<ReturnType<typeof getDb>>): Promise<AdminOverview> {
  const now = Date.now();
  const weekAgo = new Date(now - WEEK_MS).toISOString();

  const [userDocs, progressDocs, prepDocs, lldDocs, dayDocs, todoDocs, hiddenDocs, auditDocs] =
    await Promise.all([
      db.collection('users').find({}).toArray(),
      db.collection('user_progress').find({}).toArray(),
      db.collection('last_min_prep_progress').find({}).toArray(),
      db.collection('lld_progress').find({}).toArray(),
      db.collection('day_tracker').find({}).toArray(),
      db.collection('daily_todos').find({}).toArray(),
      db.collection('hidden_leaderboard_users').find({}).toArray(),
      db.collection('admin_audit').find({}).sort({ created_at: -1 }).limit(40).toArray(),
    ]);

  const hidden = new Set(hiddenDocs.map((h) => String(h.user_id)));

  const progressByUser = new Map<string, typeof progressDocs>();
  for (const row of progressDocs) {
    const uid = String(row.user_id);
    if (!progressByUser.has(uid)) progressByUser.set(uid, []);
    progressByUser.get(uid)!.push(row);
  }

  const prepByUser = new Map<string, typeof prepDocs>();
  for (const row of prepDocs) {
    const uid = String(row.user_id);
    if (!prepByUser.has(uid)) prepByUser.set(uid, []);
    prepByUser.get(uid)!.push(row);
  }

  const lldByUser = new Map<string, typeof lldDocs>();
  for (const row of lldDocs) {
    const uid = String(row.user_id);
    if (!lldByUser.has(uid)) lldByUser.set(uid, []);
    lldByUser.get(uid)!.push(row);
  }

  const dayByUser = new Map<string, number>();
  const dayUpdated = new Map<string, string>();
  for (const row of dayDocs) {
    const uid = String(row.user_id);
    const completions = Array.isArray(row.completions) ? row.completions : [];
    dayByUser.set(uid, completions.length);
    if (row.updated_at) dayUpdated.set(uid, String(row.updated_at));
  }

  const todosDoneByUser = new Map<string, number>();
  const todoUpdated = new Map<string, string>();
  for (const row of todoDocs) {
    const uid = String(row.user_id);
    if (row.done === true || row.status === 'done') {
      todosDoneByUser.set(uid, (todosDoneByUser.get(uid) ?? 0) + 1);
    }
    const ts = String(row.updated_at ?? row.created_at ?? '');
    if (ts && (!todoUpdated.has(uid) || ts > todoUpdated.get(uid)!)) {
      todoUpdated.set(uid, ts);
    }
  }

  const doneSets = new Map<string, Set<number>>();
  const users: AdminUserRow[] = [];

  for (const doc of userDocs) {
    const id = doc._id.toString();
    const username = String(doc.username);
    if (username === ADMIN_USERNAME) continue;

    const prog = progressByUser.get(id) ?? [];
    const prep = prepByUser.get(id) ?? [];
    const lld = lldByUser.get(id) ?? [];

    let problemsDone = 0;
    let problemsRevise = 0;
    const doneSet = new Set<number>();
    const progDates: string[] = [];
    for (const p of prog) {
      progDates.push(String(p.updated_at ?? ''));
      if (p.status === 'done') {
        problemsDone++;
        doneSet.add(Number(p.question_id));
      } else if (p.status === 'revise') problemsRevise++;
    }
    doneSets.set(id, doneSet);

    let lastMinDone = 0;
    let lastMinRevise = 0;
    const prepDates: string[] = [];
    for (const p of prep) {
      prepDates.push(String(p.updated_at ?? ''));
      if (p.status === 'done') lastMinDone++;
      else if (p.status === 'revise') lastMinRevise++;
    }

    let lldDone = 0;
    const lldDates: string[] = [];
    for (const p of lld) {
      lldDates.push(String(p.updated_at ?? ''));
      if (p.status === 'done') lldDone++;
    }

    const lastSeen = maxIso([
      ...progDates,
      ...prepDates,
      ...lldDates,
      dayUpdated.get(id),
      todoUpdated.get(id),
      String(doc.created_at ?? ''),
    ]);

    const inactive =
      !lastSeen || now - new Date(lastSeen).getTime() > INACTIVE_MS || problemsDone + lastMinDone < 3;

    users.push({
      id,
      username,
      created_at: String(doc.created_at ?? new Date().toISOString()),
      lastSeen,
      problemsDone,
      problemsRevise,
      problemsTotalTracked: prog.length,
      lastMinDone,
      lastMinRevise,
      lldDone,
      day100Days: dayByUser.get(id) ?? 0,
      todosDone: todosDoneByUser.get(id) ?? 0,
      inactive,
      hiddenFromLeaderboard: hidden.has(id),
      leakRisk: false,
    });
  }

  users.sort((a, b) => (b.lastSeen ?? '').localeCompare(a.lastSeen ?? ''));

  const leaks: AdminLeakPair[] = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const a = users[i];
      const b = users[j];
      const setA = doneSets.get(a.id) ?? new Set();
      const setB = doneSets.get(b.id) ?? new Set();
      if (setA.size < LEAK_MIN_DONE || setB.size < LEAK_MIN_DONE) continue;
      let shared = 0;
      for (const id of setA) if (setB.has(id)) shared++;
      const union = setA.size + setB.size - shared;
      const similarity = union > 0 ? shared / union : 0;
      if (similarity >= LEAK_SIMILARITY && shared >= LEAK_MIN_DONE) {
        leaks.push({
          userAId: a.id,
          userA: a.username,
          userBId: b.id,
          userB: b.username,
          sharedDone: shared,
          similarity: Math.round(similarity * 1000) / 1000,
        });
        a.leakRisk = true;
        b.leakRisk = true;
      }
    }
  }
  leaks.sort((a, b) => b.similarity - a.similarity);

  const totalProblemsDone = users.reduce((s, u) => s + u.problemsDone, 0);
  const activeWeek = users.filter((u) => u.lastSeen && u.lastSeen >= weekAgo).length;

  const stats = {
    totalUsers: users.length,
    activeWeek,
    inactiveUsers: users.filter((u) => u.inactive).length,
    avgProblemsDone: users.length ? Math.round((totalProblemsDone / users.length) * 10) / 10 : 0,
    totalProblemsDone,
    hiddenUsers: users.filter((u) => u.hiddenFromLeaderboard).length,
    leakPairs: leaks.length,
  };

  const audit: AdminAuditEntry[] = auditDocs.map((d) => ({
    id: String(d.id ?? d._id?.toString()),
    admin: String(d.admin),
    action: d.action as AdminAuditAction,
    target_user_id: d.target_user_id ? String(d.target_user_id) : undefined,
    target_username: d.target_username ? String(d.target_username) : undefined,
    detail: d.detail ? String(d.detail) : undefined,
    created_at: String(d.created_at),
  }));

  return { stats, users, leaks, audit };
}

async function buildUserDetail(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: string
): Promise<AdminUserDetail | null> {
  const overview = await buildOverview(db);
  const user = overview.users.find((u) => u.id === userId);
  if (!user) return null;

  const [progress, prep, lld] = await Promise.all([
    db
      .collection('user_progress')
      .find({ user_id: userId })
      .sort({ updated_at: -1 })
      .limit(30)
      .toArray(),
    db
      .collection('last_min_prep_progress')
      .find({ user_id: userId })
      .sort({ updated_at: -1 })
      .limit(30)
      .toArray(),
    db
      .collection('lld_progress')
      .find({ user_id: userId })
      .sort({ updated_at: -1 })
      .limit(30)
      .toArray(),
  ]);

  return {
    user,
    recentProblems: progress.map((p) => ({
      question_id: Number(p.question_id),
      question_title: p.question_title ? String(p.question_title) : undefined,
      status: String(p.status ?? 'todo'),
      updated_at: String(p.updated_at ?? ''),
    })),
    recentLastMin: prep.map((p) => ({
      leetcode_id: Number(p.leetcode_id),
      status: String(p.status ?? 'todo'),
      updated_at: String(p.updated_at ?? ''),
    })),
    recentLld: lld.map((p) => ({
      topic_id: String(p.topic_id),
      status: String(p.status ?? 'todo'),
      updated_at: String(p.updated_at ?? ''),
    })),
  };
}

async function resetUser(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: string,
  scope: AdminResetScope
): Promise<string[]> {
  const cleared: string[] = [];
  const run = async (label: string, fn: () => Promise<unknown>) => {
    await fn();
    cleared.push(label);
  };

  if (scope === 'problems' || scope === 'all') {
    await run('problems', () => db.collection('user_progress').deleteMany({ user_id: userId }));
    await run('completion_events', () =>
      db.collection('completion_events').deleteMany({ user_id: userId })
    );
  }
  if (scope === 'lastmin' || scope === 'all') {
    await run('last_min_prep', () =>
      db.collection('last_min_prep_progress').deleteMany({ user_id: userId })
    );
  }
  if (scope === 'lld' || scope === 'all') {
    await run('lld', () => db.collection('lld_progress').deleteMany({ user_id: userId }));
  }
  if (scope === 'day100' || scope === 'all') {
    await run('day100', () => db.collection('day_tracker').deleteMany({ user_id: userId }));
  }
  if (scope === 'todos' || scope === 'all') {
    await run('todos', () => db.collection('daily_todos').deleteMany({ user_id: userId }));
  }
  return cleared;
}

export async function GET(request: NextRequest) {
  try {
    const { admin, pin } = authFrom(request);
    if (!assertAdminAccess(admin, pin)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get('action') ?? 'overview';
    const db = await getDb();

    if (action === 'user') {
      const userId = request.nextUrl.searchParams.get('userId');
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
      const detail = await buildUserDetail(db, userId);
      if (!detail) return NextResponse.json({ error: 'not found' }, { status: 404 });
      await writeAudit(db, {
        admin: ADMIN_USERNAME,
        action: 'view_user',
        target_user_id: userId,
        target_username: detail.user.username,
        created_at: new Date().toISOString(),
      });
      return NextResponse.json(detail);
    }

    const overview = await buildOverview(db);
    return NextResponse.json(overview);
  } catch (error) {
    console.error('GET /api/admin error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { admin, pin } = authFrom(request, body);
    if (!assertAdminAccess(admin, pin)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const action = String(body.action ?? '');
    const db = await getDb();
    const userId = typeof body.userId === 'string' ? body.userId : '';
    let username = typeof body.username === 'string' ? body.username : '';

    if (userId && !username) {
      try {
        const doc = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        username = doc ? String(doc.username) : '';
      } catch {
        username = '';
      }
    }

    if (action === 'reset') {
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
      const scope = (body.scope as AdminResetScope) || 'all';
      const cleared = await resetUser(db, userId, scope);
      await writeAudit(db, {
        admin: ADMIN_USERNAME,
        action: 'reset',
        target_user_id: userId,
        target_username: username,
        detail: `scope=${scope}; cleared=${cleared.join(',')}`,
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, cleared });
    }

    if (action === 'hide_leaderboard' || action === 'unhide_leaderboard') {
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
      if (action === 'hide_leaderboard') {
        await db.collection('hidden_leaderboard_users').updateOne(
          { user_id: userId },
          {
            $set: {
              user_id: userId,
              username,
              updated_at: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
      } else {
        await db.collection('hidden_leaderboard_users').deleteMany({ user_id: userId });
      }
      await writeAudit(db, {
        admin: ADMIN_USERNAME,
        action,
        target_user_id: userId,
        target_username: username,
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }

    if (action === 'export_csv') {
      await writeAudit(db, {
        admin: ADMIN_USERNAME,
        action: 'export_csv',
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/admin error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
