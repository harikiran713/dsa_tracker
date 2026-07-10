'use client';

import { useState } from 'react';
import { Code2, ArrowRight, Sparkles, BookOpen, Target, Zap, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string) => Promise<void>;
  isLoading?: boolean;
}

export function LoginScreen({ onLogin, isLoading = false }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [error, setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = username.trim();

    if (!trimmed)       { setError('Please enter a username');                      return; }
    if (trimmed.length < 3)  { setError('Username must be at least 3 characters'); return; }
    if (trimmed.length > 50) { setError('Username must be less than 50 characters'); return; }

    try {
      await onLogin(trimmed);
    } catch {
      setError('Failed to sign in. Please try again.');
    }
  };

  const features = [
    { icon: BookOpen,    label: '323 Curated Problems', color: '#60A5FA' },
    { icon: Target,      label: 'Track Your Progress',  color: '#4ADE80' },
    { icon: Zap,         label: 'Easy · Medium · Hard',  color: '#C4B5FD' },
    { icon: CheckCircle2, label: 'Sync via MongoDB',   color: '#FCD34D' },
  ];

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background blobs */}
      <div className="bg-blobs">
        <div className="blob blob-blue"   style={{ width: 650, height: 650, top: '-12%',  left: '-18%' }} />
        <div className="blob blob-purple" style={{ width: 520, height: 520, bottom: '-6%', right: '-12%' }} />
        <div className="blob blob-cyan"   style={{ width: 320, height: 320, top: '38%',   left: '52%'  }} />
      </div>

      <div className="z-content w-full max-w-[440px] animate-scale-in">

        {/* ── Wordmark ──────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,#3B82F6,#2563EB)',
              boxShadow: '0 8px 28px rgba(59,130,246,0.50)',
            }}
          >
            <Code2 className="w-6 h-6 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">PrepTracker</p>
            <p className="text-xs" style={{ color: '#64748B' }}>SDE Interview Prep</p>
          </div>
        </div>

        {/* ── Main glass card ───────────────────────────────────── */}
        <div className="glass-card p-8 mb-5">
          {/* Heading */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.26)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.75} />
              <span className="text-xs font-semibold text-blue-400 tracking-wide">Welcome back</span>
            </div>
            <h1 className="text-3xl font-bold text-gradient-hero mb-2 leading-tight">
              Track your coding<br />interview prep
            </h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Sign in to sync progress across all sessions
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-widest mb-2.5"
                style={{ color: '#64748B' }}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. johndoe"
                className="glass-input"
                disabled={isLoading}
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs mt-2 pl-1" style={{ color: '#475569' }}>
                No password required — your progress is stored by username.
              </p>
            </div>

            {error && (
              <div
                className="rounded-2xl px-4 py-3 animate-fade-in"
                style={{
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.26)',
                }}
              >
                <p className="text-sm font-medium" style={{ color: '#FCA5A5' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full justify-center"
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Feature pills ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {features.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} strokeWidth={1.75} />
              <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
