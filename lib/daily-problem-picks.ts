import { Question } from './questions';
import { slugFromLeetCodeUrl } from './leetcode-sync';
import { mulberry32, hashString, seededShuffle } from './seeded-random';

/** Difficulty-count patterns to rotate between for the daily picks (4 total each). */
const DIFFICULTY_PATTERNS: Question['phase'][][] = [
  ['Easy', 'Medium', 'Medium', 'Hard'],
  ['Medium', 'Medium', 'Medium', 'Medium'],
  ['Easy', 'Easy', 'Medium', 'Hard'],
  ['Easy', 'Medium', 'Hard', 'Hard'],
  ['Easy', 'Medium', 'Medium', 'Medium'],
];

/**
 * Deterministically picks 4 problems for the day — same picks for everyone
 * all day, a different set (and a different difficulty mix, e.g. 1 Easy/2
 * Medium/1 Hard one day, 4 Medium the next) once the date rolls over.
 * Prefers problems not yet solved on LeetCode; only falls back to an
 * already-solved one if a difficulty bucket has no unsolved problems left.
 */
export function getDailyProblemPicks(
  questions: Question[],
  solvedSlugs: Set<string>,
  dateKey: string = new Date().toISOString().slice(0, 10)
): Question[] {
  if (questions.length === 0) return [];
  const rng = mulberry32(hashString(dateKey));
  const pattern = DIFFICULTY_PATTERNS[Math.floor(rng() * DIFFICULTY_PATTERNS.length)];

  const byPhase = new Map<Question['phase'], Question[]>();
  for (const q of questions) {
    const list = byPhase.get(q.phase) ?? [];
    list.push(q);
    byPhase.set(q.phase, list);
  }

  const isSolved = (q: Question) => {
    const slug = slugFromLeetCodeUrl(q.leetcodeUrl);
    return !!slug && solvedSlugs.has(slug);
  };

  const usedNumbers = new Set<number>();
  const picks: Question[] = [];

  for (const phase of pattern) {
    const pool = seededShuffle(byPhase.get(phase) ?? [], rng).filter(
      (q) => !usedNumbers.has(q.number)
    );
    const candidate = pool.find((q) => !isSolved(q)) ?? pool[0];
    if (candidate) {
      usedNumbers.add(candidate.number);
      picks.push(candidate);
    }
  }

  return picks;
}
