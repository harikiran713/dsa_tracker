'use client';

import { useCallback, useEffect, useState } from 'react';
import { getLeaderboard } from '@/lib/db-service';
import {
  LeaderboardEntry,
  LeaderboardPeriod,
  LEADERBOARD_PERIOD_LABELS,
  DIFFICULTY_SCORES,
} from '@/lib/leaderboard';
import { Crown, Medal, RefreshCw, Trophy, CheckCircle2, Star } from 'lucide-react';

interface LeaderboardPanelProps {
  currentUserId: string;
}

const RANK_STYLES: Record<number, { bg: string; border: string; color: string }> = {
  1: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', color: '#FCD34D' },
  2: { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.35)', color: '#CBD5E1' },
  3: { bg: 'rgba(180,83,9,0.15)', border: 'rgba(180,83,9,0.35)', color: '#FDBA74' },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-4 h-4" style={{ color: '#FCD34D' }} strokeWidth={2} />;
  if (rank === 2) return <Medal className="w-4 h-4" style={{ color: '#CBD5E1' }} strokeWidth={2} />;
  if (rank === 3) return <Medal className="w-4 h-4" style={{ color: '#FDBA74' }} strokeWidth={2} />;
  return (
    <span className="leaderboard-rank-num" style={{ color: '#64748B' }}>
      {rank}
    </span>
  );
}

export function LeaderboardPanel({ currentUserId }: LeaderboardPanelProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('day');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getLeaderboard(period);
      setEntries(data);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const currentUserEntry = entries.find((e) => e.user_id === currentUserId);

  return (
    <div className="leaderboard-panel">
      <div className="glass-panel p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <Trophy className="w-4 h-4" style={{ color: '#FCD34D' }} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Leaderboard</h2>
              <p className="text-xs" style={{ color: '#64748B' }}>
                Ranked by score — Easy 2pts · Medium 4pts · Hard 6pts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadLeaderboard}
            disabled={isLoading}
            className="btn btn-sm btn-secondary flex items-center gap-1.5 self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={2} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.25)' }}>
            Easy = {DIFFICULTY_SCORES.Easy} pts
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.25)' }}>
            Medium = {DIFFICULTY_SCORES.Medium} pts
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' }}>
            Hard = {DIFFICULTY_SCORES.Hard} pts
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(LEADERBOARD_PERIOD_LABELS) as LeaderboardPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`filter-pill ${period === p ? 'active-all' : ''}`}
            >
              {LEADERBOARD_PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {currentUserEntry && (
        <div className="glass-panel p-4 mb-4 leaderboard-you-banner">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="leaderboard-avatar leaderboard-avatar--you">
                {currentUserEntry.username[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#60A5FA' }}>
                  Your Rank
                </p>
                <p className="font-bold text-white truncate">{currentUserEntry.username}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold tabular-nums" style={{ color: '#60A5FA' }}>
                #{currentUserEntry.rank}
              </p>
              <p className="text-xs" style={{ color: '#64748B' }}>
                {currentUserEntry.score} pts · {currentUserEntry.problemsCompleted} problems
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">{LEADERBOARD_PERIOD_LABELS[period]} Rankings</h3>
          <span className="text-xs" style={{ color: '#64748B' }}>
            Sorted by score
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="spinner" />
            <p className="text-sm" style={{ color: '#94A3B8' }}>Loading rankings…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: '#475569' }} strokeWidth={1.5} />
            <p className="font-medium text-white mb-1">No activity yet</p>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Mark problems as Done during {LEADERBOARD_PERIOD_LABELS[period].toLowerCase()} to appear here.
            </p>
          </div>
        ) : (
          <ul className="leaderboard-list">
            {entries.map((entry) => {
              const isYou = entry.user_id === currentUserId;
              const rankStyle = RANK_STYLES[entry.rank];
              return (
                <li
                  key={entry.user_id}
                  className={`leaderboard-row ${isYou ? 'leaderboard-row--you' : ''}`}
                  style={
                    rankStyle
                      ? { background: rankStyle.bg, borderColor: rankStyle.border }
                      : undefined
                  }
                >
                  <div className="leaderboard-rank">
                    <RankBadge rank={entry.rank} />
                  </div>
                  <div className="leaderboard-user">
                    <div
                      className={`leaderboard-avatar ${isYou ? 'leaderboard-avatar--you' : ''}`}
                    >
                      {entry.username[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">
                        {entry.username}
                        {isYou && (
                          <span className="ml-2 text-xs font-semibold" style={{ color: '#60A5FA' }}>
                            (You)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="leaderboard-stats">
                    <span className="leaderboard-stat leaderboard-stat--score" title="Total score">
                      <Star className="w-3.5 h-3.5" style={{ color: '#FCD34D' }} strokeWidth={2} />
                      {entry.score}
                    </span>
                    <span className="leaderboard-stat" title="Problems completed">
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} strokeWidth={2} />
                      {entry.problemsCompleted}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
