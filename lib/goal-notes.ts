export interface GoalNote {
  id: string;
  user_id: string;
  title: string;
  text: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_PREFIX = 'goal_notes_';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadGoalNotes(userId: string): GoalNote[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
  } catch {
    return [];
  }
}

export function saveGoalNotes(userId: string, notes: GoalNote[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(notes));
}
