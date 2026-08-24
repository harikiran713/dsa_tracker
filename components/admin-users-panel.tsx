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
  UserCheck,
  UserX,
  TrendingUp,
  Hash,
  Link2,
  type LucideIcon,
} from 'lucide-react';
import {
  ADMIN_PIN_STORAGE_KEY,
  ADMIN_USERNAME,
  AdminAuditAction,
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

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
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

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'done' ? 'admin-status--done' : status === 'revise' ? 'admin-status--revise' : 'admin-status--todo';
  return <span className={`admin-status ${tone}`}>{status}</span>;
}

const AVATAR_PALETTE: [string, string][] = [
  ['#3B82F6', '#2563EB'],
  ['#06B6D4', '#0891B2'],
  ['#8B5CF6', '#7C3AED'],
  ['#F59E0B', '#D97706'],
  ['#10B981', '#059669'],
  ['#EC4899', '#DB2777'],
];

function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const [a, b] = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function leakSeverity(similarity: number): { label: string; tone: string } {
  if (similarity >= 0.9) return { label: 'High risk', tone: 'admin-risk--high' };
  if (similarity >= 0.8) return { label: 'Medium risk', tone: 'admin-risk--medium' };
  return { label: 'Elevated', tone: 'admin-risk--low' };
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="admin-progress" title={`${value} of ${total} problems done`}>
      <div className="admin-progress-track">
        <div className="admin-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="admin-progress-label">
        {value}
        {total > 0 ? `/${total}` : ''}
      </span>
    </div>
  );
}

const AUDIT_META: Record<AdminAuditAction, { icon: LucideIcon; tone: string; label: string }> = {
  view_overview: { icon: Activity, tone: 'admin-audit-icon--neutral', label: 'Viewed overview' },
  view_user: { icon: Eye, tone: 'admin-audit-icon--blue', label: 'Viewed user' },
  reset: { icon: RotateCcw, tone: 'admin-audit-icon--amber', label: 'Reset progress' },
  hide_leaderboard: { icon: EyeOff, tone: 'admin-audit-icon--rose', label: 'Hid from leaderboard' },
  unhide_leaderboard: { icon: Eye, tone: 'admin-audit-icon--green', label: 'Unhid from leaderboard' },
  export_csv: { icon: Download, tone: 'admin-audit-icon--cyan', label: 'Exported CSV' },
};

function UserRowSkeleton() {
  return (
    <div className="admin-skeleton-row" aria-hidden="true">
      <div className="admin-skeleton admin-skeleton-avatar" />
      <div className="admin-skeleton-lines">
        <div className="admin-skeleton admin-skeleton-line" style={{ width: '35%' }} />
        <div className="admin-skeleton admin-skeleton-line" style={{ width: '60%' }} />
      </div>
    </div>
  );
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

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [message]);

  useEffect(() => {
    if (!detail && !resetFor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setDetail(null);
      setResetFor(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, resetFor]);

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

  const filterOptions = useMemo<[FilterMode, string, number][]>(
    () => [
      ['all', 'All', users.length],
      ['active', 'Active', users.filter((u) => !u.inactive).length],
      ['inactive', 'Inactive', users.filter((u) => u.inactive).length],
      ['leaks', 'Leak risk', users.filter((u) => u.leakRisk).length],
      ['hidden', 'Hidden LB', users.filter((u) => u.hiddenFromLeaderboard).length],
    ],
    [users]
  );

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
      <main className="admin-shell relative min-h-screen overflow-x-hidden flex items-center justify-center p-4">
        <form onSubmit={unlock} className="z-content admin-unlock-card animate-scale-in">
          <div className="admin-unlock-brand">
            <div className="admin-brand-mark">
              <Shield className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="admin-brand-name">PrepTracker</p>
              <p className="admin-brand-sub">Admin access</p>
            </div>
          </div>

          <div className="admin-unlock-copy">
            <h1 className="admin-unlock-title">Unlock console</h1>
            <p className="admin-unlock-subtitle">
              Enter the PIN for <span className="admin-unlock-user">{ADMIN_USERNAME}</span>
            </p>
          </div>

          <label className="admin-field-label" htmlFor="admin-pin">
            Admin PIN
          </label>
          <div className="admin-pin-wrap">
            <Lock className="admin-pin-icon" strokeWidth={1.75} />
            <input
              id="admin-pin"
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••••••"
              className="glass-input w-full admin-pin-input"
              autoFocus
              autoComplete="current-password"
            />
          </div>
          {pinError && <p className="admin-field-error">{pinError}</p>}

          <div className="admin-unlock-actions">
            <button type="submit" className="btn btn-primary flex-1">
              Unlock admin
            </button>
            <button type="button" onClick={onLogout} className="btn btn-secondary">
              Sign out
            </button>
          </div>
        </form>
      </main>
    );
  }

  const stats = overview?.stats;

  const statCards = [
    { label: 'Users', value: stats?.totalUsers ?? '—', icon: Users, tone: 'admin-stat--neutral' },
    { label: 'Active week', value: stats?.activeWeek ?? '—', icon: UserCheck, tone: 'admin-stat--green' },
    { label: 'Inactive', value: stats?.inactiveUsers ?? '—', icon: UserX, tone: 'admin-stat--amber' },
    { label: 'Avg done', value: stats?.avgProblemsDone ?? '—', icon: TrendingUp, tone: 'admin-stat--blue' },
    { label: 'Total done', value: stats?.totalProblemsDone ?? '—', icon: Hash, tone: 'admin-stat--cyan' },
    { label: 'Leak pairs', value: stats?.leakPairs ?? '—', icon: Link2, tone: 'admin-stat--rose' },
  ];

  return (
    <main className="admin-shell relative min-h-screen overflow-x-hidden">
      <header className="glass-header sticky top-0 z-50">
        <div className="admin-topbar-inner">
          <div className="flex items-center gap-3 min-w-0">
            <div className="admin-brand-mark">
              <Shield className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="admin-brand-name">Admin console</p>
              <p className="admin-brand-sub truncate">{ADMIN_USERNAME}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => void exportCsv()}
              className="btn btn-sm btn-secondary flex items-center gap-1.5"
              disabled={!overview}
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="btn btn-sm btn-secondary flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button type="button" onClick={onLogout} className="btn btn-sm btn-danger flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="admin-content z-content relative">
        <header className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Overview</h1>
            <p className="admin-page-subtitle">
              Manage users, review leak risks, and audit admin actions.
            </p>
          </div>
          {loading && overview && (
            <span className="admin-live-pill">
              <RefreshCw className="w-3 h-3 animate-spin" strokeWidth={2} />
              Syncing
            </span>
          )}
        </header>

        {message && <div className="admin-banner admin-banner--ok animate-fade-in">{message}</div>}
        {error && <div className="admin-banner admin-banner--err animate-fade-in">{error}</div>}

        <div className="admin-stats-grid">
          {statCards.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className={`admin-stat-card ${tone}`}>
              <div className="admin-stat-top">
                <span className="admin-stat-label">{label}</span>
                <div className="admin-stat-icon">
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </div>
              </div>
              <p className="admin-stat-value">{value}</p>
            </div>
          ))}
        </div>

        <div className="admin-toolbar">
          <div className="admin-search">
            <Search className="admin-search-icon" strokeWidth={1.75} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username…"
              className="glass-input w-full admin-search-input"
            />
            {search && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
          <div className="admin-filter-row" role="tablist" aria-label="Filter users">
            {filterOptions.map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                onClick={() => setFilter(id)}
                className={`filter-pill ${filter === id ? 'active-all' : ''}`}
              >
                {label}
                <span className="admin-filter-count">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {overview && overview.leaks.length > 0 && (
          <div className="admin-leak-panel">
            <div className="admin-leak-header">
              <div className="admin-leak-icon">
                <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="admin-section-title">Progress leak alerts</h2>
                <p className="admin-section-subtitle">
                  Pairs with unusually similar completion patterns
                </p>
              </div>
            </div>
            <ul className="admin-leak-list">
              {overview.leaks.slice(0, 8).map((l) => {
                const sev = leakSeverity(l.similarity);
                const pct = Math.round(l.similarity * 100);
                return (
                  <li key={`${l.userAId}-${l.userBId}`} className="admin-leak-row">
                    <div className="admin-leak-main">
                      <span className={`admin-risk-badge ${sev.tone}`}>{sev.label}</span>
                      <div className="admin-leak-pair">
                        <span className="admin-leak-user">{l.userA}</span>
                        <Link2 className="admin-leak-swap-icon" strokeWidth={2} />
                        <span className="admin-leak-user">{l.userB}</span>
                      </div>
                    </div>
                    <div className="admin-leak-meter">
                      <div className="admin-leak-meter-track">
                        <div className="admin-leak-meter-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="admin-leak-meter-label">
                        {pct}% · {l.sharedDone} shared
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="admin-main-grid">
          <section className="admin-users-panel overflow-hidden">
            <div className="admin-panel-header">
              <div className="admin-panel-heading">
                <Users className="w-4 h-4 admin-panel-heading-icon" strokeWidth={1.75} />
                <div>
                  <h2 className="admin-section-title">Users</h2>
                  <p className="admin-section-subtitle">{filtered.length} shown</p>
                </div>
              </div>
            </div>

            {loading && users.length === 0 ? (
              <div>
                <UserRowSkeleton />
                <UserRowSkeleton />
                <UserRowSkeleton />
                <UserRowSkeleton />
              </div>
            ) : filtered.length === 0 ? (
              <div className="admin-empty">
                <span className="admin-empty-icon">
                  <Search className="w-5 h-5" strokeWidth={1.5} />
                </span>
                <p>No users match this filter.</p>
              </div>
            ) : (
              <div className="admin-user-table-wrap">
                <div className="admin-table-grid admin-table-head" role="row">
                  <span>User</span>
                  <span>Problems</span>
                  <span>Prep</span>
                  <span>LLD</span>
                  <span>100 Days</span>
                  <span>Todos</span>
                  <span>Last seen</span>
                  <span className="admin-table-head-actions">Actions</span>
                </div>
                <ul className="admin-user-list">
                  {filtered.map((u) => (
                    <li key={u.id} className="admin-user-row admin-table-grid">
                      <div className="admin-user-identity">
                        <span
                          className="admin-user-avatar"
                          style={{ background: avatarGradient(u.username) }}
                        >
                          {u.username[0]?.toUpperCase() ?? '?'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="admin-user-name-row">
                            <p className="admin-user-name truncate">{u.username}</p>
                            {u.inactive && <span className="admin-tag admin-tag--inactive">Inactive</span>}
                            {u.leakRisk && <span className="admin-tag admin-tag--leak">Leak risk</span>}
                            {u.hiddenFromLeaderboard && (
                              <span className="admin-tag admin-tag--hidden">Hidden LB</span>
                            )}
                          </div>
                          <p className="admin-user-meta">Joined {formatShortDate(u.created_at)}</p>
                        </div>
                      </div>

                      <div className="admin-cell-grid-mobile">
                        <div className="admin-cell" data-label="Problems">
                          <ProgressBar value={u.problemsDone} total={u.problemsTotalTracked} />
                        </div>
                        <div className="admin-cell" data-label="Prep">
                          <span className="admin-cell-value">{u.lastMinDone}</span>
                        </div>
                        <div className="admin-cell" data-label="LLD">
                          <span className="admin-cell-value">{u.lldDone}</span>
                        </div>
                        <div className="admin-cell" data-label="100 Days">
                          <span className="admin-cell-value">{u.day100Days}</span>
                        </div>
                        <div className="admin-cell" data-label="Todos">
                          <span className="admin-cell-value">{u.todosDone}</span>
                        </div>
                        <div className="admin-cell" data-label="Last seen" title={formatDate(u.lastSeen)}>
                          <span className="admin-cell-value admin-cell-value--muted">
                            {formatRelative(u.lastSeen)}
                          </span>
                        </div>
                      </div>

                      <div className="admin-user-actions">
                        <button
                          type="button"
                          className="admin-icon-btn admin-tip"
                          data-tip="View details"
                          aria-label={`View ${u.username}`}
                          onClick={() => void openDetail(u.id)}
                        >
                          <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn admin-tip"
                          data-tip="Reset progress"
                          aria-label={`Reset ${u.username}`}
                          onClick={() => {
                            setResetFor(u);
                            setResetScope('all');
                          }}
                          disabled={busyUserId === u.id}
                        >
                          {busyUserId === u.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                          )}
                        </button>
                        <button
                          type="button"
                          className={`admin-icon-btn admin-tip ${u.hiddenFromLeaderboard ? 'admin-icon-btn--active' : ''}`}
                          data-tip={u.hiddenFromLeaderboard ? 'Unhide from leaderboard' : 'Hide from leaderboard'}
                          aria-label={
                            u.hiddenFromLeaderboard
                              ? `Unhide ${u.username} from leaderboard`
                              : `Hide ${u.username} from leaderboard`
                          }
                          onClick={() => void toggleHidden(u)}
                          disabled={busyUserId === u.id}
                        >
                          {u.hiddenFromLeaderboard ? (
                            <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="admin-audit-panel overflow-hidden">
            <div className="admin-panel-header">
              <div className="admin-panel-heading">
                <ClipboardList className="w-4 h-4 admin-panel-heading-icon admin-panel-heading-icon--blue" strokeWidth={1.75} />
                <div>
                  <h2 className="admin-section-title">Audit log</h2>
                  <p className="admin-section-subtitle">Recent admin actions</p>
                </div>
              </div>
            </div>
            {!overview?.audit?.length ? (
              <div className="admin-empty admin-empty--compact">
                <span className="admin-empty-icon">
                  <ClipboardList className="w-5 h-5" strokeWidth={1.5} />
                </span>
                <p>No admin actions yet.</p>
              </div>
            ) : (
              <ul className="admin-audit-list">
                {overview.audit.map((a) => {
                  const meta = AUDIT_META[a.action] ?? AUDIT_META.view_overview;
                  const Icon = meta.icon;
                  return (
                    <li key={a.id} className="admin-audit-row">
                      <span className={`admin-audit-icon ${meta.tone}`}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                      </span>
                      <div className="admin-audit-body">
                        <div className="admin-audit-line">
                          <span className="admin-audit-action">{meta.label}</span>
                          {a.target_username && (
                            <span className="admin-audit-target">→ {a.target_username}</span>
                          )}
                        </div>
                        {a.detail && <span className="admin-audit-detail">{a.detail}</span>}
                        <span className="admin-audit-time" title={formatDate(a.created_at)}>
                          {formatRelative(a.created_at)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {(detail || detailLoading) && (
        <div className="admin-modal-backdrop" onClick={() => setDetail(null)} role="presentation">
          <div
            className="admin-modal admin-modal--wide animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="User detail"
          >
            <div className="admin-modal-header">
              <div className="flex items-center gap-3 min-w-0">
                <div className="admin-modal-icon">
                  <Activity className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <h3 className="admin-modal-title truncate">
                    {detailLoading ? 'Loading…' : detail?.user.username}
                  </h3>
                  <p className="admin-modal-subtitle">Read-only progress snapshot</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setDetail(null)}
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            {detailLoading && !detail && (
              <div>
                <UserRowSkeleton />
                <UserRowSkeleton />
              </div>
            )}

            {detail && (
              <>
                <div className="admin-modal-stats">
                  {[
                    ['Problems done', detail.user.problemsDone],
                    ['Prep done', detail.user.lastMinDone],
                    ['LLD done', detail.user.lldDone],
                    ['100 days', detail.user.day100Days],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="admin-modal-stat">
                      <p className="admin-modal-stat-label">{label}</p>
                      <p className="admin-modal-stat-value">{value}</p>
                    </div>
                  ))}
                </div>

                <section className="admin-modal-section">
                  <h4 className="admin-modal-section-title">Recent problems</h4>
                  {detail.recentProblems.length === 0 ? (
                    <p className="admin-modal-empty">None</p>
                  ) : (
                    <ul className="admin-modal-list">
                      {detail.recentProblems.map((p) => (
                        <li key={p.question_id} className="admin-modal-list-item">
                          <span className="truncate">
                            #{p.question_id} {p.question_title ?? ''}
                          </span>
                          <StatusBadge status={p.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="admin-modal-section">
                  <h4 className="admin-modal-section-title">Recent Last Min / CP</h4>
                  {detail.recentLastMin.length === 0 ? (
                    <p className="admin-modal-empty">None</p>
                  ) : (
                    <ul className="admin-modal-list">
                      {detail.recentLastMin.map((p) => (
                        <li key={p.leetcode_id} className="admin-modal-list-item">
                          <span>#{p.leetcode_id}</span>
                          <StatusBadge status={p.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="admin-modal-section">
                  <h4 className="admin-modal-section-title">Recent LLD</h4>
                  {detail.recentLld.length === 0 ? (
                    <p className="admin-modal-empty">None</p>
                  ) : (
                    <ul className="admin-modal-list">
                      {detail.recentLld.map((p) => (
                        <li key={p.topic_id} className="admin-modal-list-item">
                          <span className="truncate">{p.topic_id}</span>
                          <StatusBadge status={p.status} />
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

      {resetFor && (
        <div className="admin-modal-backdrop" style={{ zIndex: 90 }} role="presentation">
          <div
            className="admin-modal animate-scale-in"
            style={{ maxWidth: '28rem' }}
            role="dialog"
            aria-modal="true"
            aria-label="Reset user"
          >
            <div className="admin-modal-header">
              <div className="flex items-center gap-3">
                <div className="admin-modal-icon admin-modal-icon--danger">
                  <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="admin-modal-title">Reset {resetFor.username}</h3>
                  <p className="admin-modal-subtitle">Clears data for this user only</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setResetFor(null)}
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="admin-modal-warning">
              <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
              <span>This permanently deletes the selected data for this user. This action cannot be undone.</span>
            </div>

            <label className="admin-field-label" htmlFor="reset-scope">
              Scope
            </label>
            <select
              id="reset-scope"
              value={resetScope}
              onChange={(e) => setResetScope(e.target.value as AdminResetScope)}
              className="glass-input w-full mb-4 admin-select"
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
                {busyUserId === resetFor.id ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                    Resetting…
                  </span>
                ) : (
                  'Confirm reset'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
