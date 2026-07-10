'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  REMINDER_INTERVAL_MS,
  triggerDailyTodoReminder,
} from '@/lib/daily-todo-reminder';

interface UseDailyTodoReminderOptions {
  userId: string | null;
  enabled: boolean;
  onToast: (message: string) => void;
  onNavigateTodos?: () => void;
}

export function useDailyTodoReminder({
  userId,
  enabled,
  onToast,
  onNavigateTodos,
}: UseDailyTodoReminderOptions) {
  const onToastRef = useRef(onToast);
  const onNavigateTodosRef = useRef(onNavigateTodos);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  useEffect(() => {
    onNavigateTodosRef.current = onNavigateTodos;
  }, [onNavigateTodos]);

  const runReminder = useCallback(
    async (force = false) => {
      if (!userId) return null;
      return triggerDailyTodoReminder({
        userId,
        force,
        onToast: (message) => onToastRef.current(message),
        onNavigateTodos: () => onNavigateTodosRef.current?.(),
      });
    },
    [userId]
  );

  useEffect(() => {
    if (!userId || !enabled) return;

    const tick = () => {
      void runReminder(false);
    };

    const intervalId = window.setInterval(tick, REMINDER_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [userId, enabled, runReminder]);

  return { runReminder };
}
