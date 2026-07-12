export const TOTAL_CHALLENGE_DAYS = 100;

export interface DayCompletion {
  day: number;
  completed_at: string;
}

export interface DayTrackerData {
  user_id: string;
  completions: DayCompletion[];
  updated_at: string;
}

function storageKey(userId: string): string {
  return `day_tracker_${userId}`;
}

export function emptyDayTracker(userId: string): DayTrackerData {
  return {
    user_id: userId,
    completions: [],
    updated_at: new Date().toISOString(),
  };
}

export function loadDayTracker(userId: string): DayTrackerData {
  if (typeof window === 'undefined') return emptyDayTracker(userId);
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return emptyDayTracker(userId);
    const parsed = JSON.parse(raw) as DayTrackerData;
    return {
      user_id: userId,
      completions: normalizeCompletions(parsed.completions ?? []),
      updated_at: parsed.updated_at || new Date().toISOString(),
    };
  } catch {
    return emptyDayTracker(userId);
  }
}

export function saveDayTracker(userId: string, data: DayTrackerData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    storageKey(userId),
    JSON.stringify({
      ...data,
      user_id: userId,
      completions: normalizeCompletions(data.completions),
      updated_at: new Date().toISOString(),
    })
  );
}

function normalizeCompletions(list: DayCompletion[]): DayCompletion[] {
  const map = new Map<number, DayCompletion>();
  for (const item of list) {
    const day = Number(item.day);
    if (!Number.isInteger(day) || day < 1 || day > TOTAL_CHALLENGE_DAYS) continue;
    const existing = map.get(day);
    if (!existing || item.completed_at > existing.completed_at) {
      map.set(day, { day, completed_at: String(item.completed_at) });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.day - b.day);
}

export function mergeDayTrackers(local: DayTrackerData, remote: DayTrackerData): DayTrackerData {
  const map = new Map<number, DayCompletion>();
  for (const item of [...local.completions, ...remote.completions]) {
    const existing = map.get(item.day);
    if (!existing || item.completed_at > existing.completed_at) {
      map.set(item.day, item);
    }
  }
  return {
    user_id: local.user_id || remote.user_id,
    completions: Array.from(map.values()).sort((a, b) => a.day - b.day),
    updated_at:
      local.updated_at > remote.updated_at ? local.updated_at : remote.updated_at,
  };
}

export function isDayCompleted(data: DayTrackerData, day: number): boolean {
  return data.completions.some((c) => c.day === day);
}

export function toggleDayCompletion(data: DayTrackerData, day: number): DayTrackerData {
  if (day < 1 || day > TOTAL_CHALLENGE_DAYS) return data;

  const exists = data.completions.some((c) => c.day === day);
  const completions = exists
    ? data.completions.filter((c) => c.day !== day)
    : [
        ...data.completions,
        { day, completed_at: new Date().toISOString() },
      ].sort((a, b) => a.day - b.day);

  return {
    ...data,
    completions,
    updated_at: new Date().toISOString(),
  };
}

export function getCompletedCount(data: DayTrackerData): number {
  return data.completions.length;
}

export function getCurrentStreak(data: DayTrackerData): number {
  const set = new Set(data.completions.map((c) => c.day));
  let streak = 0;
  for (let day = 1; day <= TOTAL_CHALLENGE_DAYS; day++) {
    if (set.has(day)) streak = day;
    else break;
  }
  return streak;
}

export function getNextIncompleteDay(data: DayTrackerData): number | null {
  const set = new Set(data.completions.map((c) => c.day));
  for (let day = 1; day <= TOTAL_CHALLENGE_DAYS; day++) {
    if (!set.has(day)) return day;
  }
  return null;
}
