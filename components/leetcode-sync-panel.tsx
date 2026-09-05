'use client';

import { useState } from 'react';
import {
  LEETCODE_SYNC_SCRIPT,
  LeetCodeSyncResult,
  clearLeetCodeSync,
  parsePastedSyncPayload,
  saveLeetCodeSync,
} from '@/lib/leetcode-sync';
import { CheckCircle2, Clipboard, ClipboardCheck, Link2, RefreshCw, Unlink } from 'lucide-react';

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
  const [pasted, setPasted] = useState('');
  const [expanded, setExpanded] = useState(!sync);
  const [error, setError] = useState('');
  const [scriptCopied, setScriptCopied] = useState(false);

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(LEETCODE_SYNC_SCRIPT);
      setScriptCopied(true);
      window.setTimeout(() => setScriptCopied(false), 2500);
    } catch {
      setError('Could not copy to clipboard — your browser may be blocking it.');
    }
  };

  const doSync = () => {
    if (!pasted.trim()) {
      setError('Paste the output the script copied to your clipboard first.');
      return;
    }
    setError('');
    try {
      const result = parsePastedSyncPayload(pasted);
      saveLeetCodeSync(userId, result);
      onSyncChange(result);
      setPasted('');
      setExpanded(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed.');
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
            This runs entirely in your own browser using your existing LeetCode login — nothing is ever sent
            to our servers, and there's no cookie to find or copy. It never expires: just re-run it whenever
            you want to refresh.
          </p>
          <ol className="text-xs mb-3 space-y-1.5 list-decimal list-inside" style={{ color: '#94A3B8' }}>
            <li>Copy the script below, then open <strong className="text-white">leetcode.com</strong> in a new tab (make sure you're logged in).</li>
            <li>Open DevTools (F12) → Console tab, paste the script, and press Enter.</li>
            <li>It'll copy your solved-problems data to your clipboard automatically — come back here and paste it below.</li>
          </ol>

          <button
            type="button"
            onClick={copyScript}
            className="btn btn-sm btn-secondary flex items-center gap-1.5 mb-3"
          >
            {scriptCopied ? (
              <>
                <ClipboardCheck className="w-3.5 h-3.5" strokeWidth={2} />
                Copied!
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" strokeWidth={2} />
                Copy sync script
              </>
            )}
          </button>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={pasted}
              onChange={(e) => {
                setPasted(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && doSync()}
              placeholder="Paste the copied result here…"
              className="glass-input flex-1 py-2 text-sm"
              style={{ borderRadius: 12, padding: '8px 14px' }}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={doSync}
              className="btn btn-sm btn-primary flex items-center gap-1.5 flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
              Sync
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
