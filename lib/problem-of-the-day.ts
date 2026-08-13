import { initializeQuestions, Question } from './questions';

/** Optional per-day manual override: IST date (YYYY-MM-DD) → question number. */
const MANUAL_OVERRIDES: Record<string, number> = {
  // Example for later admin support:
  // '2026-08-10': 42,
};

/** Calendar date in Asia/Kolkata (YYYY-MM-DD). Rolls at 12:00 AM IST. */
export function getISTDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Stable FNV-1a style hash → unsigned 32-bit. */
export function hashDateKey(dateKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Canonical pool (Easy → Medium → Hard, fixed numbers). Not the shuffled UI mix. */
export function getPotdQuestionPool(): Question[] {
  return initializeQuestions();
}

export interface ProblemOfTheDayResult {
  dateIST: string;
  question: Question | null;
  index: number;
  overridden: boolean;
}

/**
 * Deterministic Problem of the Day for all users on a given IST calendar day.
 * Optional MANUAL_OVERRIDES[dateIST] can force a question number later via admin.
 */
export function getProblemOfTheDay(
  now: Date = new Date(),
  pool: Question[] = getPotdQuestionPool()
): ProblemOfTheDayResult {
  const dateIST = getISTDateString(now);

  if (pool.length === 0) {
    return { dateIST, question: null, index: -1, overridden: false };
  }

  const overrideNumber = MANUAL_OVERRIDES[dateIST];
  if (typeof overrideNumber === 'number') {
    const overridden = pool.find((q) => q.number === overrideNumber) ?? null;
    if (overridden) {
      return {
        dateIST,
        question: overridden,
        index: pool.findIndex((q) => q.number === overrideNumber),
        overridden: true,
      };
    }
  }

  const index = hashDateKey(dateIST) % pool.length;
  return {
    dateIST,
    question: pool[index] ?? null,
    index,
    overridden: false,
  };
}

export function getProblemSolveUrl(question: Question): string | null {
  if (question.leetcodeUrl) return question.leetcodeUrl;
  return null;
}
