'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!message || !mounted) return null;

  return createPortal(
    <div className="reminder-toast-layer" role="presentation">
      <button
        type="button"
        className="reminder-toast-backdrop"
        onClick={onDismiss}
        aria-label="Dismiss reminder"
      />
      <div className="reminder-toast" role="alertdialog" aria-live="assertive" aria-modal="true">
        <div className="reminder-toast-icon">
          <Bell className="w-6 h-6" strokeWidth={1.75} />
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
          aria-label="Close reminder"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>,
    document.body
  );
}
