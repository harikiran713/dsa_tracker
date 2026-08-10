'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  RefreshCw,
  LogOut,
  Shield,
  Search,
  Download,
  Eye,
  RotateCcw,
  EyeOff,
  AlertTriangle,
  Activity,
  ClipboardList,
  Lock,
  X,
} from 'lucide-react';
import {
  ADMIN_PIN_STORAGE_KEY,
  ADMIN_USERNAME,
  AdminOverview,
  AdminResetScope,
  AdminUserDetail,
  AdminUserRow,
  isValidAdminPin,
} from '@/lib/admin';
import {
  adminLogExport,
  adminResetUser,
  adminSetLeaderboardHidden,
  fetchAdminOverview,
  fetchAdminUserDetail,
} from '@/lib/db-service';

interface AdminUsersPanelProps {
  onLogout: () => void;
}

type FilterMode = 'all' | 'active' | 'inactive' | 'leaks' | 'hidden';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function downloadCsv(users: AdminUserRow[]) {
  const headers = [
    'username',
    'joined',
    'last_seen',
    'problems_done',
    'problems_revise',
    'lastmin_done',
    'lld_done',
    'day100_days',
    'todos_done',
    'inactive',
    'hidden',
    'leak_risk',
  ];
  const lines = [
    headers.join(','),
    ...users.map((u) =>
      [
        u.username,
        u.created_at,
        u.lastSeen ?? '',
        u.problemsDone,
        u.problemsRevise,
        u.lastMinDone,
        u.lldDone,
        u.day100Days,
        u.todosDone,
        u.inactive,
        u.hiddenFromLeaderboard,
        u.leakRisk,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `preptracker-users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminUsersPanel({ onLogout }: AdminUsersPanelProps) {
  const [pinInput, setPinInput] = useState('');
  const [pin, setPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [resetFor, setResetFor] = useState<AdminUserRow | null>(null);
  const [resetScope, setResetScope] = useState<AdminResetScope>('all');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem(ADMIN_PIN_STORAGE_KEY);
    if (saved && isValidAdminPin(saved)) setPin(saved);
  }, []);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAdminPin(pinInput)) {
      setPinError('Invalid admin PIN');
      return;
    }
    sessionStorage.setItem(ADMIN_PIN_STORAGE_KEY, pinInput.trim());
    setPin(pinInput.trim());
    setPinError(null);
  };

  const load = useCallback(async () => {
    if (!pin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOverview(pin);
      if (!data) {
        setError('Failed to load admin overview (check PIN / server).');
        setOverview(null);
      } else {
        setOverview(data);
      }
    } catch {
      setError('Failed to load admin overview.');
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [pin]);

  useEffect(() => {
    if (pin) void load();
  }, [pin, load]);

  const users = overview?.users ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !u.username.toLowerCase().includes(q)) return false;
      if (filter === 'active') return !u.inactive;
      if (filter === 'inactive') return u.inactive;
      if (filter === 'leaks') return u.leakRisk;
      if (filter === 'hidden') return u.hiddenFromLeaderboard;
      return true;
    });
  }, [users, search, filter]);

  const openDetail = async (userId: string) => {
    if (!pin) return;
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await fetchAdminUserDetail(pin, userId);
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmReset = async () => {
    if (!pin || !resetFor) return;
    setBusyUserId(resetFor.id);
    setMessage(null);
    const ok = await adminResetUser(pin, resetFor.id, resetFor.username, resetScope);
    setBusyUserId(null);
    setResetFor(null);
    setMessage(ok ? `Reset ${resetScope} for ${resetFor.username}` : 'Reset failed');
    await load();
    if (detail?.user.id === resetFor.id) await openDetail(resetFor.id);
  };

  const toggleHidden = async (u: AdminUserRow) => {
    if (!pin) return;
    setBusyUserId(u.id);
    const ok = await adminSetLeaderboardHidden(pin, u.id, u.username, !u.hiddenFromLeaderboard);
    setBusyUserId(null);
    setMessage(
      ok
        ? `${u.username} ${u.hiddenFromLeaderboard ? 'shown on' : 'hidden from'} leaderboard`
        : 'Moderation failed'
    );
    await load();
  };

  const exportCsv = async () => {
    if (!pin || !overview) return;
    downloadCsv(overview.users);
    await adminLogExport(pin);
    setMessage('CSV exported');
    await load();
  };

  if (!pin) {
    return (
      <main className="app-shell relative min-h-screen overflow-x-hidden flex items-center justify-center p-4">
        <div className="bg-blobs">
          <div className="blob blob-blue" style={{ width: 700, height: 700, top: '-15%', left: '-20%' }} />
        </div>
        <form onSubmit={unlock} className="z-content glass-panel p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.28)' }}
            >
              <Lock className="w-5 h-5" style={{ color: '#FBBF24' }} />
            </div>
            <div>
              <h1 className="font-semibold text-white text-lg">Admin unlock</h1>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Enter PIN for {ADMIN_USERNAME}
              </p>
            </div>
          </div>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="Admin PIN"
            className="glass-input w-full mb-3"
            style={{ borderRadius: 12, padding: '12px 14px' }}
            autoFocus
          />
          {pinError && (
            <p className="text-sm mb-3" style={{ color: '#FCA5A5' }}>
              {pinError}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" className="btn btn-sm btn-primary flex-1">
              Unlock admin
            </button>
            <button type="button" onClick={onLogout} className="btn btn-sm btn-secondary">
              Sign out
            </button>
          </div>
        </form>
      </main>
    );
  }

  const stats = overview?.stats;

  return (
    <main className="app-shell relative min-h-screen overflow-x-hidden">
      <div className="bg-blobs">
        <div className="blob blob-blue" style={{ width: 700, height: 700, top: '-15%', left: '-20%' }} />
        <div className="blob blob-purple" style={{ width: 550, height: 550, bottom: '-8%', right: '-12%' }} />
      </div>

      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg,#F59E0B,#EF4444)',
                boxShadow: '0 6px 20px rgba(245,158,11,0.35)',
              }}
            >
              <Shield className="w-4 h-4 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Admin console</p>
              <p className="text-xs" style={{ color: '#64748B' }}>{ADMIN_USERNAME}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void exportCsv()}
              className="btn btn-sm btn-secondary flex items-center gap-1.5"
              disabled={!overview}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="btn btn-sm btn-secondary flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button type="button" onClick={onLogout} className="btn btn-sm btn-danger flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="z-content relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {message && (
          <div className="glass-panel p-3 mb-4 text-sm" style={{ color: '#86EFAC' }}>
            {message}
          </div>
        )}
        {error && (
          <div className="glass-panel p-3 mb-4 text-sm" style={{ color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        {/* Global stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Users', value: stats?.totalUsers ?? '—', color: '#FFFFFF' },
            { label: 'Active week', value: stats?.activeWeek ?? '—', color: '#4ADE80' },
            { label: 'Inactive', value: stats?.inactiveUsers ?? '—', color: '#FCD34D' },
            { label: 'Avg done', value: stats?.avgProblemsDone ?? '—', color: '#60A5FA' },
            { label: 'Total done', value: stats?.totalProblemsDone ?? '—', color: '#C4B5FD' },
            { label: 'Leak pairs', value: stats?.leakPairs ?? '—', color: '#FB7185' },
          ].map((s) => (
            <div key={s.label} className="glass-panel p-4">
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>
                {s.label}
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div className="glass-panel p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: '#64748B' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username…"
              className="glass-input w-full"
              style={{ borderRadius: 12, padding: '10px 14px 10px 36px' }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              ['all', 'All'],
              ['active', 'Active'],
              ['inactive', 'Inactive'],
              ['leaks', 'Leak risk'],
              ['hidden', 'Hidden LB'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`filter-pill ${filter === id ? 'active-all' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Leak alerts */}
        {overview && overview.leaks.length > 0 && (
          <div className="glass-panel p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" style={{ color: '#FBBF24' }} />
              <h2 className="font-semibold text-white text-sm">Progress leak alerts</h2>
            </div>
            <ul className="space-y-2">
              {overview.leaks.slice(0, 8).map((l) => (
                <li
                  key={`${l.userAId}-${l.userBId}`}
                  className="text-sm flex flex-wrap gap-x-3 gap-y-1"
                  style={{ color: '#CBD5E1' }}
                >
                  <span className="font-medium text-white">{l.userA}</span>
                  <span style={{ color: '#64748B' }}>↔</span>
                  <span className="font-medium text-white">{l.userB}</span>
                  <span style={{ color: '#FCD34D' }}>
                    {Math.round(l.similarity * 100)}% similar · {l.sharedDone} shared done
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Users table */}
        <div className="glass-panel overflow-hidden mb-6">
          <div className="px-5 py-4 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <Users className="w-4 h-4" style={{ color: '#FBBF24' }} />
            <h2 className="font-semibold text-white">Users</h2>
            <span className="text-xs" style={{ color: '#64748B' }}>
              {filtered.length} shown
            </span>
          </div>

          {loading && users.length === 0 ? (
            <p className="p-8 text-center text-sm" style={{ color: '#64748B' }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm" style={{ color: '#64748B' }}>No users match.</p>
          ) : (
            <ul>
              {filtered.map((u) => (
                <li
                  key={u.id}
                  className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}
                    >
                      {u.username[0]?.toUpperCase() ?? '?'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white truncate">{u.username}</p>
                        {u.inactive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D' }}>
                            inactive
                          </span>
                        )}
                        {u.leakRisk && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(244,63,94,0.15)', color: '#FB7185' }}>
                            leak risk
                          </span>
                        )}
                        {u.hiddenFromLeaderboard && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(148,163,184,0.15)', color: '#94A3B8' }}>
                            hidden LB
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: '#64748B' }}>
                        Joined {new Date(u.created_at).toLocaleDateString()} · Last seen {formatDate(u.lastSeen)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                        Problems {u.problemsDone}d/{u.problemsRevise}r · Prep {u.lastMinDone}d · LLD {u.lldDone} · 100d {u.day100Days}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary flex items-center gap-1"
                      onClick={() => void openDetail(u.id)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary flex items-center gap-1"
                      onClick={() => {
                        setResetFor(u);
                        setResetScope('all');
                      }}
                      disabled={busyUserId === u.id}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary flex items-center gap-1"
                      onClick={() => void toggleHidden(u)}
                      disabled={busyUserId === u.id}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      {u.hiddenFromLeaderboard ? 'Unhide LB' : 'Hide LB'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Audit log */}
        <div className="glass-panel overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <ClipboardList className="w-4 h-4" style={{ color: '#60A5FA' }} />
            <h2 className="font-semibold text-white">Audit log</h2>
          </div>
          {!overview?.audit?.length ? (
            <p className="p-6 text-sm" style={{ color: '#64748B' }}>No admin actions yet.</p>
          ) : (
            <ul>
              {overview.audit.map((a) => (
                <li
                  key={a.id}
                  className="px-5 py-3 text-sm border-b flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#CBD5E1' }}
                >
                  <span className="tabular-nums text-xs" style={{ color: '#64748B' }}>
                    {formatDate(a.created_at)}
                  </span>
                  <span className="font-medium text-white">{a.action}</span>
                  {a.target_username && <span>→ {a.target_username}</span>}
                  {a.detail && (
                    <span className="text-xs" style={{ color: '#64748B' }}>
                      {a.detail}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* View-as / drill-down modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.72)' }}>
          <div className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: '#38BDF8' }} />
                <div>
                  <h3 className="font-semibold text-white">
                    {detailLoading ? 'Loading…' : `View as ${detail?.user.username}`}
                  </h3>
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    Read-only progress snapshot
                  </p>
                </div>
              </div>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setDetail(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {detail && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    ['Problems done', detail.user.problemsDone],
                    ['Prep done', detail.user.lastMinDone],
                    ['LLD done', detail.user.lldDone],
                    ['100 days', detail.user.day100Days],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-[10px] uppercase" style={{ color: '#64748B' }}>{label}</p>
                      <p className="text-lg font-bold text-white tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>

                <section className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Recent problems</h4>
                  {detail.recentProblems.length === 0 ? (
                    <p className="text-xs" style={{ color: '#64748B' }}>None</p>
                  ) : (
                    <ul className="space-y-1 max-h-40 overflow-y-auto">
                      {detail.recentProblems.map((p) => (
                        <li key={p.question_id} className="text-xs flex justify-between gap-2" style={{ color: '#CBD5E1' }}>
                          <span className="truncate">
                            #{p.question_id} {p.question_title ?? ''}
                          </span>
                          <span style={{ color: p.status === 'done' ? '#4ADE80' : '#FCD34D' }}>{p.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Recent Last Min / CP</h4>
                  {detail.recentLastMin.length === 0 ? (
                    <p className="text-xs" style={{ color: '#64748B' }}>None</p>
                  ) : (
                    <ul className="space-y-1 max-h-40 overflow-y-auto">
                      {detail.recentLastMin.map((p) => (
                        <li key={p.leetcode_id} className="text-xs flex justify-between gap-2" style={{ color: '#CBD5E1' }}>
                          <span>#{p.leetcode_id}</span>
                          <span style={{ color: p.status === 'done' ? '#4ADE80' : '#FCD34D' }}>{p.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-white mb-2">Recent LLD</h4>
                  {detail.recentLld.length === 0 ? (
                    <p className="text-xs" style={{ color: '#64748B' }}>None</p>
                  ) : (
                    <ul className="space-y-1">
                      {detail.recentLld.map((p) => (
                        <li key={p.topic_id} className="text-xs flex justify-between gap-2" style={{ color: '#CBD5E1' }}>
                          <span>{p.topic_id}</span>
                          <span style={{ color: p.status === 'done' ? '#4ADE80' : '#FCD34D' }}>{p.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reset confirm */}
      {resetFor && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.72)' }}>
          <div className="glass-panel w-full max-w-md p-5">
            <h3 className="font-semibold text-white mb-1">Reset {resetFor.username}</h3>
            <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
              Clears data for this user only. Other accounts are not affected.
            </p>
            <label className="block text-xs mb-2" style={{ color: '#64748B' }}>
              Scope
            </label>
            <select
              value={resetScope}
              onChange={(e) => setResetScope(e.target.value as AdminResetScope)}
              className="glass-input w-full mb-4"
              style={{ borderRadius: 12, padding: '10px 12px' }}
            >
              <option value="all">All progress</option>
              <option value="problems">Problems only</option>
              <option value="lastmin">Last Min Prep / CP only</option>
              <option value="lld">LLD only</option>
              <option value="day100">100 Days only</option>
              <option value="todos">Daily todos only</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setResetFor(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => void confirmReset()}
                disabled={busyUserId === resetFor.id}
              >
                Confirm reset
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
