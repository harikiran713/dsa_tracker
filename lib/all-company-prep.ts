import {
  LastMinPrepCategory,
  LastMinPrepProgress,
  LastMinPrepQuestion,
} from './last-min-prep';
import { getAllAmazonPrepQuestions } from './amazon-prep';
import { getAllAmazonTweakQuestions } from './amazon-tweak';
import { getAllGooglePrepQuestions } from './google-prep';

export type AllCompanyPrepProgress = LastMinPrepProgress;

function mergedQuestions(): LastMinPrepQuestion[] {
  const source = [
    ...getAllAmazonPrepQuestions(),
    ...getAllAmazonTweakQuestions(),
    ...getAllGooglePrepQuestions(),
  ];

  const byId = new Map<number, LastMinPrepQuestion>();
  for (const question of source) {
    const existing = byId.get(question.leetcodeId);
    if (!existing) {
      byId.set(question.leetcodeId, { ...question, category: 'All Company Questions' });
    } else if (question.important && !existing.important) {
      byId.set(question.leetcodeId, { ...existing, important: true });
    }
  }

  return [...byId.values()];
}

export const ALL_COMPANY_PREP_CATEGORIES: LastMinPrepCategory[] = [
  {
    id: 'all-company-questions',
    name: 'All Company Questions',
    pattern: 'Amazon + Tweak Amazon + Google, deduped',
    questions: mergedQuestions(),
  },
];

export function getAllCompanyPrepQuestions(): LastMinPrepQuestion[] {
  return ALL_COMPANY_PREP_CATEGORIES.flatMap((c) => c.questions);
}

const STORAGE_PREFIX = 'all_company_prep_';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadAllCompanyPrepProgress(userId: string): AllCompanyPrepProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
  } catch {
    return [];
  }
}

export function saveAllCompanyPrepProgress(userId: string, rows: AllCompanyPrepProgress[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(rows));
}
