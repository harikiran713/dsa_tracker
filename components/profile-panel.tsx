'use client';

import { useMemo } from 'react';
import { User } from '@/lib/types';
import { Question } from '@/lib/questions';
import {
  CompletionEvent,
  DailyTodoItem,
  computeSolvedBreakdown,
  dedupeCompletionEvents,
} from '@/lib/activity';
import { ActivityHeatmap } from './activity-heatmap';
import { UserRound, Flame, Trophy, CheckCircle2 } from 'lucide-react';

interface ProfilePanelProps {
  user: User;
  questions: Question[];
  completionEvents: CompletionEvent[];
  dailyTodos: DailyTodoItem[];
  reviseCount: number;
}

function DiffBar({
  label,
  done,
  total,
  color,
}: {
  label: string;
  done: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between text-xs mb-1">
        <span style={{ color }}>{label}</span>
        <span className="tabular-nums" style={{ color: '#94A3B8' }}>
          <strong className="text-white">{done}</strong>/{total}
        </span>
      </div>
      <div className="progress-track" style={{ height: 6 }}>
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export function ProfilePanel({
  user,
  questions,
  completionEvents,
  dailyTodos,
  reviseCount,
}: ProfilePanelProps) {
  const breakdown = useMemo(() => computeSolvedBreakdown(questions), [questions]);
  const submissions = useMemo(
    () => dedupeCompletionEvents(completionEvents).length,
    [completionEvents]
  );
  const todosDone = useMemo(() => dailyTodos.filter((t) => t.done).length, [dailyTodos]);

  const joined = useMemo(() => {
    try {
      return new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  }, [user.created_at]);

  return (
    <div className="profile-panel">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 mb-6">
        {/* Profile card */}
        <div className="glass-panel p-5">
          <div className="flex flex-col items-center text-center mb-5">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
              style={{
                background: 'linear-gradient(135deg,#FFA116,#F97316)',
                boxShadow: '0 10px 28px rgba(255,161,22,0.35)',
              }}
            >
              {user.username[0]?.toUpperCase() ?? '?'}
            </div>
            <h2 className="text-xl font-semibold text-white">{user.username}</h2>
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>
              Joined {joined}
            </p>
          </div>

          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: 'rgba(255,161,22,0.08)', border: '1px solid rgba(255,161,22,0.2)' }}
          >
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-4xl font-bold text-white tabular-nums">
                {breakdown.totalDone}
              </span>
              <span className="text-sm pb-1" style={{ color: '#94A3B8' }}>
                / {breakdown.totalQuestions}
              </span>
            </div>
            <p className="text-center text-xs" style={{ color: '#FFA116' }}>
              Solved
            </p>
          </div>

          <DiffBar label="Easy" done={breakdown.Easy.done} total={breakdown.Easy.total} color="#4ADE80" />
          <DiffBar label="Medium" done={breakdown.Medium.done} total={breakdown.Medium.total} color="#FCD34D" />
          <DiffBar label="Hard" done={breakdown.Hard.done} total={breakdown.Hard.total} color="#F87171" />
        </div>

        {/* Full stats */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Submissions',
                value: submissions,
                icon: CheckCircle2,
                color: '#FFA116',
              },
              {
                label: 'To Revise',
                value: reviseCount,
                icon: Flame,
                color: '#FCD34D',
              },
              {
                label: 'Todos done',
                value: todosDone,
                icon: Trophy,
                color: '#60A5FA',
              },
              {
                label: 'Progress',
                value: `${
                  breakdown.totalQuestions
                    ? Math.round((breakdown.totalDone / breakdown.totalQuestions) * 100)
                    : 0
                }%`,
                icon: UserRound,
                color: '#C4B5FD',
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.75} />
                  <span className="text-xs" style={{ color: '#64748B' }}>
                    {label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <ActivityHeatmap
            completionEvents={completionEvents}
            title="Submission heatmap"
            variant="full"
          />
        </div>
      </div>
    </div>
  );
}
