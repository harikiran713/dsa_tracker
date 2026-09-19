'use client';

import { useState } from 'react';
import {
  LeetCodeSyncResult,
  clearLeetCodeSync,
  saveLeetCodeSync,
  syncLeetCodeSession,
} from '@/lib/leetcode-sync';
import { CheckCircle2, Link2, Loader2, RefreshCw, Unlink } from 'lucide-react';

interface LeetCodeSyncPanelProps {
  userId: string;
  sync: LeetCodeSyncResult | null;
  onSyncChange: (result: LeetCodeSyncResult | null) => void;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function LeetCodeSyncPanel({ userId, sync, onSyncChange }: LeetCodeSyncPanelProps) {
  const [token, setToken] = useState('');
  const [expanded, setExpanded] = useState(!sync);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doSync = async () => {
    if (!token.trim()) {
      setError('Paste your LEETCODE_SESSION cookie value first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await syncLeetCodeSession(token.trim());
      saveLeetCodeSync(userId, result);
      onSyncChange(result);
      setToken('');
      setExpanded(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed.');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    clearLeetCodeSync(userId);
    onSyncChange(null);
    setExpanded(true);
  };

  return (
    <div className="glass-panel p-4 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,161,22,0.14)', border: '1px solid rgba(255,161,22,0.30)' }}
          >
            <Link2 className="w-4 h-4" style={{ color: '#FFA116' }} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm">LeetCode sync</p>
            {sync ? (
              <p className="text-xs truncate" style={{ color: '#64748B' }}>
                <CheckCircle2 className="w-3 h-3 inline-block mr-1 -mt-0.5" style={{ color: '#4ADE80' }} />
                {sync.totalSolved} solved · synced {formatTimestamp(sync.syncedAt)}
              </p>
            ) : (
              <p className="text-xs" style={{ color: '#64748B' }}>
                Connect your account to filter out questions you've already solved.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {sync && (
            <button type="button" onClick={disconnect} className="btn btn-sm btn-secondary flex items-center gap-1.5">
              <Unlink className="w-3.5 h-3.5" strokeWidth={2} />
              Disconnect
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="btn btn-sm btn-secondary flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
            {sync ? 'Re-sync' : 'Connect'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs mb-3" style={{ color: '#64748B' }}>
            Paste your LeetCode session cookie and we'll fetch your solved problems for you. The
            cookie is only used to make that one request — it's never stored.
          </p>
          <ol className="text-xs mb-3 space-y-1.5 list-decimal list-inside" style={{ color: '#94A3B8' }}>
            <li>Open <strong className="text-white">leetcode.com</strong> in another tab and make sure you're logged in.</li>
            <li>Open DevTools (F12) → Application tab → Cookies → leetcode.com.</li>
            <li>Copy the value of the <strong className="text-white">LEETCODE_SESSION</strong> cookie and paste it below.</li>
          </ol>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && !loading && doSync()}
              placeholder="Paste LEETCODE_SESSION cookie value…"
              className="glass-input flex-1 py-2 text-sm"
              style={{ borderRadius: 12, padding: '8px 14px' }}
              autoComplete="off"
              disabled={loading}
            />
            <button
              type="button"
              onClick={doSync}
              disabled={loading}
              className="btn btn-sm btn-primary flex items-center gap-1.5 flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
              )}
              {loading ? 'Syncing…' : 'Sync'}
            </button>
          </div>
          {error && (
            <p className="text-xs mt-2" style={{ color: '#FCA5A5' }}>{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
