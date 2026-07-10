import { DailyTodoItem, getTodosForDate, loadDailyTodos, toDateKey } from './activity';

export const DAILY_TODO_REMINDER_SOUND = '/sounds/daily-todo-reminder.mp3';
export const REMINDER_INTERVAL_MS = 60 * 60 * 1000;

const ENABLED_KEY_PREFIX = 'daily_todo_reminder_enabled_';

export function isReminderEnabled(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(`${ENABLED_KEY_PREFIX}${userId}`);
  if (stored === null) return true;
  return stored === 'true';
}

export function setReminderEnabled(userId: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${ENABLED_KEY_PREFIX}${userId}`, enabled ? 'true' : 'false');
}

export function getPendingTodayCount(todos: DailyTodoItem[], date = toDateKey()): number {
  return getTodosForDate(todos, date).filter((t) => !t.done).length;
}

export function getPendingTodayCountForUser(userId: string, date = toDateKey()): number {
  return getPendingTodayCount(loadDailyTodos(userId), date);
}

export function formatReminderMessage(pendingCount: number): string {
  if (pendingCount === 1) {
    return 'You have 1 pending daily todo for today.';
  }
  return `You have ${pendingCount} pending daily todos for today.`;
}

let audioInstance: HTMLAudioElement | null = null;

export async function playReminderSound(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (!audioInstance) {
      audioInstance = new Audio(DAILY_TODO_REMINDER_SOUND);
      audioInstance.preload = 'auto';
    }
    audioInstance.currentTime = 0;
    await audioInstance.play();
  } catch (error) {
    console.warn('Could not play reminder sound:', error);
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function showBrowserNotification(
  message: string,
  onClick?: () => void
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const notification = new Notification('Daily Todo Reminder', {
      body: message,
      icon: '/favicon.ico',
      silent: true,
      tag: 'daily-todo-reminder',
      renotify: true,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };

    return true;
  } catch (error) {
    console.warn('Could not show browser notification:', error);
    return false;
  }
}

export interface TriggerReminderOptions {
  userId: string;
  todos?: DailyTodoItem[];
  force?: boolean;
  onToast?: (message: string) => void;
  onNavigateTodos?: () => void;
}

export async function triggerDailyTodoReminder({
  userId,
  todos,
  force = false,
  onToast,
  onNavigateTodos,
}: TriggerReminderOptions): Promise<{ shown: boolean; pendingCount: number; message: string }> {
  const pendingCount = todos
    ? getPendingTodayCount(todos)
    : getPendingTodayCountForUser(userId);

  if (!force && pendingCount === 0) {
    return { shown: false, pendingCount: 0, message: '' };
  }

  const message =
    force && pendingCount === 0
      ? 'Test reminder — no pending daily todos for today.'
      : formatReminderMessage(pendingCount);

  if (force) {
    await requestNotificationPermission();
  }

  await playReminderSound();
  onToast?.(message);
  showBrowserNotification(message, onNavigateTodos);

  return { shown: true, pendingCount, message };
}
