'use client';

import { Bell, X } from 'lucide-react';

interface DailyTodoReminderToastProps {
  message: string | null;
  onDismiss: () => void;
  onOpenTodos?: () => void;
}

export function DailyTodoReminderToast({
  message,
  onDismiss,
  onOpenTodos,
}: DailyTodoReminderToastProps) {
  if (!message) return null;

  return (
    <div className="reminder-toast" role="status" aria-live="polite">
      <div className="reminder-toast-icon">
        <Bell className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <div className="reminder-toast-body">
        <p className="reminder-toast-title">Daily Todo Reminder</p>
        <p className="reminder-toast-message">{message}</p>
        {onOpenTodos && (
          <button type="button" className="reminder-toast-link" onClick={onOpenTodos}>
            Open Daily Todo
          </button>
        )}
      </div>
      <button
        type="button"
        className="reminder-toast-close"
        onClick={onDismiss}
        aria-label="Dismiss reminder"
      >
        <X className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}
