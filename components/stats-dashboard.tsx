'use client';

import { useMemo, useState } from 'react';
import {
  CompletionEvent,
  DailyTodoItem,
  StatsPeriod,
  STATS_PERIOD_LABELS,
  computePeriodStats,
  isInPeriod,
  dedupeCompletionEvents,
} from '@/lib/activity';
import { BarChart3, CheckCircle2, ListTodo, Calendar, TrendingUp } from 'lucide-react';

interface StatsDashboardProps {
  completionEvents: CompletionEvent[];
  dailyTodos: DailyTodoItem[];
  reviseCount: number;
}

export function StatsDashboard({ completionEvents, dailyTodos, reviseCount }: StatsDashboardProps) {
  const [period, setPeriod] = useState<StatsPeriod>('7d');

  const stats = useMemo(
    () => computePeriodStats(completionEvents, dailyTodos, period),
    [completionEvents, dailyTodos, period]
  );

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
      color: '#C4B5FD',
      bg: 'rgba(139,92,246,0.15)',
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
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.22)' }}
            >
              <BarChart3 className="w-4 h-4" style={{ color: '#60A5FA' }} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Activity Analytics</h2>
              <p className="text-xs" style={{ color: '#64748B' }}>
                Track how many problems and todos you finish over time
              </p>
            </div>
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
