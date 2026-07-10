'use client';

import { useState } from 'react';
import {
  getPendingTodayCount,
  isReminderEnabled,
  requestNotificationPermission,
  setReminderEnabled,
} from '@/lib/daily-todo-reminder';
import { DailyTodoItem } from '@/lib/activity';
import { Bell, BellOff, Volume2 } from 'lucide-react';

interface DailyTodoReminderControlsProps {
  userId: string;
  todos: DailyTodoItem[];
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onTest: () => void;
}

export function DailyTodoReminderControls({
  userId,
  todos,
  enabled,
  onEnabledChange,
  onTest,
}: DailyTodoReminderControlsProps) {
  const [statusNote, setStatusNote] = useState('');

  const pendingToday = getPendingTodayCount(todos);

  const handleToggle = async () => {
    const next = !enabled;

    if (next) {
      const permission = await requestNotificationPermission();
      if (permission === 'denied') {
        setStatusNote('Browser notifications blocked — you will still get in-app alerts and sound.');
      } else {
        setStatusNote('');
      }
    }

    setReminderEnabled(userId, next);
    onEnabledChange(next);
  };

  return (
    <div className="glass-panel p-5 mb-6 reminder-controls">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <Bell className="w-4 h-4" style={{ color: '#FCD34D' }} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Hourly Daily Todo Reminder</h3>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Every hour, plays your custom sound if you have pending todos for today.
              {pendingToday > 0 ? (
                <span className="text-amber-300 font-medium"> {pendingToday} pending right now.</span>
              ) : (
                <span> No pending todos for today.</span>
              )}
            </p>
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>
              Works while this tab is open. Reminders are off when you close the site.
            </p>
            {statusNote && (
              <p className="text-xs mt-2" style={{ color: '#FCD34D' }}>{statusNote}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onTest}
            className="btn btn-secondary flex items-center gap-1.5"
          >
            <Volume2 className="w-4 h-4" strokeWidth={2} />
            Test Reminder
          </button>
          <button
            type="button"
            onClick={handleToggle}
            className={`btn flex items-center gap-1.5 ${enabled ? 'btn-danger' : 'btn-primary'}`}
          >
            {enabled ? (
              <>
                <BellOff className="w-4 h-4" strokeWidth={2} />
                Turn Off Reminders
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" strokeWidth={2} />
                Turn On Reminders
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: '#64748B' }}>
        <span
          className={`reminder-status-dot ${enabled ? 'reminder-status-dot--on' : ''}`}
          aria-hidden
        />
        <span>
          Status: <strong style={{ color: enabled ? '#4ADE80' : '#94A3B8' }}>{enabled ? 'On' : 'Off'}</strong>
          {enabled && ' · checks every hour'}
        </span>
      </div>
    </div>
  );
}

export function getInitialReminderEnabled(userId: string): boolean {
  return isReminderEnabled(userId);
}
