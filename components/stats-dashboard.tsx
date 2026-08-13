'use client';

import { useMemo, useState } from 'react';
import {
  CompletionEvent,
  DailyTodoItem,
  StatsPeriod,
  STATS_PERIOD_LABELS,
  computePeriodStats,
  computeSolvedBreakdown,
  isInPeriod,
  dedupeCompletionEvents,
} from '@/lib/activity';
import { Question } from '@/lib/questions';
import { CheckCircle2, ListTodo, Calendar, TrendingUp } from 'lucide-react';
import { ActivityHeatmap } from './activity-heatmap';
import { NotesSearchPanel } from './notes-search-panel';

interface StatsDashboardProps {
  completionEvents: CompletionEvent[];
  dailyTodos: DailyTodoItem[];
  reviseCount: number;
  userId?: string;
  questions?: Question[];
}

export function StatsDashboard({
  completionEvents,
  dailyTodos,
  reviseCount,
  userId,
  questions = [],
}: StatsDashboardProps) {
  const [period, setPeriod] = useState<StatsPeriod>('7d');

  const stats = useMemo(
    () => computePeriodStats(completionEvents, dailyTodos, period),
    [completionEvents, dailyTodos, period]
  );

  const breakdown = useMemo(() => computeSolvedBreakdown(questions), [questions]);

  const recentCompletions = useMemo(
    () =>
      dedupeCompletionEvents(completionEvents)
        .filter((e) => isInPeriod(e.completed_at, period))
        .slice(0, 15),
    [completionEvents, period]
  );

  const maxDayCount = Math.max(...stats.byDay.map((d) => d.count), 1);
  const todoRate =
    stats.todosTotal > 0 ? Math.round((stats.todosDone / stats.todosTotal) * 100) : 0;

  const summaryCards = [
    {
      label: 'Problems Done',
      value: stats.completed,
      sub: STATS_PERIOD_LABELS[period],
      icon: CheckCircle2,
      color: '#4ADE80',
      bg: 'rgba(34,197,94,0.15)',
    },
    {
      label: 'Daily Todos Done',
      value: `${stats.todosDone}/${stats.todosTotal}`,
      sub: stats.todosTotal > 0 ? `${todoRate}% completion` : 'No todos yet',
      icon: ListTodo,
      color: '#60A5FA',
      bg: 'rgba(59,130,246,0.15)',
    },
    {
      label: 'Avg per Day',
      value:
        stats.byDay.length > 0
          ? (stats.completed / stats.byDay.length).toFixed(1)
          : '0',
      sub: 'Problems completed',
      icon: TrendingUp,
      color: '#22D3EE',
      bg: 'rgba(6,182,212,0.15)',
    },
    {
      label: 'Flagged Revise',
      value: reviseCount,
      sub: 'Currently marked',
      icon: Calendar,
      color: '#FCD34D',
      bg: 'rgba(245,158,11,0.15)',
    },
  ];

  return (
    <div className="stats-dashboard">
      <div className="glass-panel p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="panel-section-header mb-0">
            <p className="panel-section-title">Period</p>
            <p className="panel-section-subtitle">
              Problems and todos completed over time
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATS_PERIOD_LABELS) as StatsPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`filter-pill ${period === p ? 'active-all' : ''}`}
            >
              {STATS_PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-icon" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#64748B' }}>
                {label}
              </p>
              <p className="text-2xl font-bold tabular-nums leading-none mb-1" style={{ color }}>
                {value}
              </p>
              <p className="text-xs" style={{ color: '#475569' }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="glass-panel p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold text-white">Full solve stats</h3>
              <p className="text-xs" style={{ color: '#64748B' }}>
                All-time progress across the curated set
              </p>
            </div>
            <p className="text-3xl font-bold tabular-nums" style={{ color: '#FFA116' }}>
              {breakdown.totalDone}
              <span className="text-base font-medium" style={{ color: '#64748B' }}>
                /{breakdown.totalQuestions}
              </span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(
              [
                ['Easy', breakdown.Easy, '#4ADE80'],
                ['Medium', breakdown.Medium, '#FCD34D'],
                ['Hard', breakdown.Hard, '#F87171'],
              ] as const
            ).map(([label, bucket, color]) => {
              const pct = bucket.total > 0 ? Math.round((bucket.done / bucket.total) * 100) : 0;
              return (
                <div
                  key={label}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color }}>
                      {label}
                    </span>
                    <span className="text-sm tabular-nums text-white">
                      {bucket.done}/{bucket.total}
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <p className="text-xs mt-2 tabular-nums" style={{ color: '#64748B' }}>
                    {pct}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ActivityHeatmap
        completionEvents={completionEvents}
        title="Submission heatmap"
        variant="full"
      />

      {userId && <NotesSearchPanel userId={userId} />}

      <div className="glass-panel p-5 mb-6">
        <h3 className="font-semibold text-white mb-1">Problems Completed per Day</h3>
        <p className="text-xs mb-5" style={{ color: '#64748B' }}>{STATS_PERIOD_LABELS[period]}</p>
        {stats.byDay.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: '#64748B' }}>
            No completions in this period. Mark problems as Done to see stats here.
          </p>
        ) : (
          <div className="stats-bar-chart">
            {stats.byDay.map((day) => (
              <div key={day.date} className="stats-bar-row">
                <span className="stats-bar-label">{day.label}</span>
                <div className="stats-bar-track">
                  <div
                    className="stats-bar-fill"
                    style={{ width: `${(day.count / maxDayCount) * 100}%` }}
                  />
                </div>
                <span className="stats-bar-value">{day.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent completions list */}
      {recentCompletions.length > 0 && (
        <div className="glass-panel p-5">
          <h3 className="font-semibold text-white mb-4">Recent Completions</h3>
          <div className="stats-recent-list">
            {recentCompletions.map((e) => (
                <div key={e.id} className="stats-recent-item">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#4ADE80' }} />
                    <span className="text-sm text-white truncate">{e.question_title}</span>
                    <span className={`badge badge-${e.question_phase.toLowerCase()}`}>
                      {e.question_phase}
                    </span>
                  </div>
                  <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: '#64748B' }}>
                    {new Date(e.completed_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
