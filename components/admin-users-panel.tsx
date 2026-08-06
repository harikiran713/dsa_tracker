'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, RefreshCw, LogOut, Shield } from 'lucide-react';
import { User } from '@/lib/types';
import { fetchAllUsers } from '@/lib/db-service';
import { ADMIN_USERNAME } from '@/lib/admin';

interface AdminUsersPanelProps {
  onLogout: () => void;
}

export function AdminUsersPanel({ onLogout }: AdminUsersPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAllUsers(ADMIN_USERNAME);
      setUsers(rows.filter((u) => u.username !== ADMIN_USERNAME));
    } catch {
      setError('Failed to load users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="app-shell relative min-h-screen overflow-x-hidden">
      <div className="bg-blobs">
        <div className="blob blob-blue" style={{ width: 700, height: 700, top: '-15%', left: '-20%' }} />
        <div className="blob blob-purple" style={{ width: 550, height: 550, bottom: '-8%', right: '-12%' }} />
      </div>

      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
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
              <p className="text-sm font-semibold text-white leading-tight">Admin</p>
              <p className="text-xs" style={{ color: '#64748B' }}>{ADMIN_USERNAME}</p>
            </div>
          </div>
          <button type="button" onClick={onLogout} className="btn btn-sm btn-danger flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <div className="z-content relative max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="glass-panel p-6 mb-6">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.28)',
                }}
              >
                <Users className="w-5 h-5" style={{ color: '#FBBF24' }} strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="font-semibold text-white text-lg">All users</h1>
                <p className="text-sm" style={{ color: '#64748B' }}>
                  {loading ? 'Loading…' : `${users.length} username${users.length === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="btn btn-sm btn-secondary flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div
            className="glass-panel p-4 mb-4 text-sm"
            style={{ color: '#FCA5A5', borderColor: 'rgba(248,113,113,0.3)' }}
          >
            {error}
          </div>
        )}

        <div className="glass-panel overflow-hidden">
          {loading && users.length === 0 ? (
            <p className="p-8 text-center text-sm" style={{ color: '#64748B' }}>
              Loading usernames…
            </p>
          ) : users.length === 0 ? (
            <p className="p-8 text-center text-sm" style={{ color: '#64748B' }}>
              No users found.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {users.map((u, i) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}
                  >
                    {u.username[0]?.toUpperCase() ?? '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{u.username}</p>
                    <p className="text-xs" style={{ color: '#64748B' }}>
                      Joined {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums flex-shrink-0" style={{ color: '#475569' }}>
                    #{i + 1}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
