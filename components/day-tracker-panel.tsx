'use client';

import { useMemo } from 'react';
import {
  DayTrackerData,
  TOTAL_CHALLENGE_DAYS,
  getCompletedCount,
  getCurrentStreak,
  getNextIncompleteDay,
  isDayCompleted,
  toggleDayCompletion,
} from '@/lib/day-tracker';
import { CalendarDays, Check, Cloud, CloudOff, Flame, Loader2, Target } from 'lucide-react';

export type DayTrackerSyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface DayTrackerPanelProps {
  data: DayTrackerData;
  onChange: (data: DayTrackerData) => void;
  syncStatus?: DayTrackerSyncStatus;
}

export function DayTrackerPanel({
  data,
  onChange,
  syncStatus = 'idle',
}: DayTrackerPanelProps) {
  const completedCount = getCompletedCount(data);
  const progressPct = Math.round((completedCount / TOTAL_CHALLENGE_DAYS) * 100);
  const streak = getCurrentStreak(data);
  const nextDay = getNextIncompleteDay(data);

  const days = useMemo(
    () => Array.from({ length: TOTAL_CHALLENGE_DAYS }, (_, i) => i + 1),
    []
  );

  const handleToggle = (day: number) => {
    onChange(toggleDayCompletion(data, day));
  };

  const syncLabel = {
    idle: 'Ready',
    saving: 'Saving to database…',
    saved: 'Saved to database',
    error: 'Could not save — will retry',
    offline: 'Saved locally only (offline user)',
  }[syncStatus];

  return (
    <div className="day-tracker-panel">
      <div className="glass-panel p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="panel-section-header mb-0">
            <p className="panel-section-title">Day tracker</p>
            <p className="panel-section-subtitle">
              Click a day when you finish that day’s work. Click again to undo.
            </p>
          </div>
          {nextDay !== null && (
            <button
              type="button"
              className="btn btn-primary flex items-center gap-1.5"
              onClick={() => handleToggle(nextDay)}
            >
              <Check className="w-4 h-4" strokeWidth={2} />
              Mark Day {nextDay} Done
            </button>
          )}
        </div>

        <div className="day-tracker-sync" aria-live="polite">
          {syncStatus === 'saving' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
          ) : syncStatus === 'error' || syncStatus === 'offline' ? (
            <CloudOff className="w-3.5 h-3.5" strokeWidth={2} />
          ) : (
            <Cloud className="w-3.5 h-3.5" strokeWidth={2} />
          )}
          <span
            style={{
              color:
                syncStatus === 'saved'
                  ? '#4ADE80'
                  : syncStatus === 'error'
                    ? '#FCA5A5'
                    : '#94A3B8',
            }}
          >
            {syncLabel}
          </span>
        </div>

        <div className="day-tracker-stats">
          <div className="day-tracker-stat">
            <Target className="w-4 h-4" style={{ color: '#60A5FA' }} strokeWidth={1.75} />
            <div>
              <p className="day-tracker-stat-label">Completed</p>
              <p className="day-tracker-stat-value">
                {completedCount}
                <span className="day-tracker-stat-total"> / {TOTAL_CHALLENGE_DAYS}</span>
              </p>
            </div>
          </div>
          <div className="day-tracker-stat">
            <Flame className="w-4 h-4" style={{ color: '#FCD34D' }} strokeWidth={1.75} />
            <div>
              <p className="day-tracker-stat-label">Streak from Day 1</p>
              <p className="day-tracker-stat-value">{streak} days</p>
            </div>
          </div>
          <div className="day-tracker-stat">
            <CalendarDays className="w-4 h-4" style={{ color: '#22D3EE' }} strokeWidth={1.75} />
            <div>
              <p className="day-tracker-stat-label">Progress</p>
              <p className="day-tracker-stat-value">{progressPct}%</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: '#94A3B8' }}>Challenge progress</span>
            <span className="font-semibold tabular-nums text-white">
              {completedCount} / {TOTAL_CHALLENGE_DAYS} days
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="glass-panel p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748B' }}>
            Day 1 → Day 100
          </p>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#64748B' }}>
            <span className="day-tracker-legend">
              <span className="day-cell day-cell--done day-cell--legend" /> Done
            </span>
            <span className="day-tracker-legend">
              <span className="day-cell day-cell--legend" /> Pending
            </span>
          </div>
        </div>

        <div className="day-tracker-grid" role="list" aria-label="100 day challenge tracker">
          {days.map((day) => {
            const done = isDayCompleted(data, day);
            return (
              <button
                key={day}
                type="button"
                role="listitem"
                className={`day-cell ${done ? 'day-cell--done' : ''} ${nextDay === day ? 'day-cell--next' : ''}`}
                onClick={() => handleToggle(day)}
                aria-pressed={done}
                title={
                  done
                    ? `Day ${day} completed — click to undo`
                    : `Day ${day} — click to mark complete`
                }
              >
                <span className="day-cell-label">Day</span>
                <span className="day-cell-number">{day}</span>
                {done && <Check className="day-cell-check" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>

        {completedCount === TOTAL_CHALLENGE_DAYS && (
          <div className="day-tracker-complete mt-6">
            <p className="font-semibold text-white mb-1">Challenge complete</p>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              You finished all 100 days. Strong work — keep the streak going.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
