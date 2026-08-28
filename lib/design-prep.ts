import {
  LastMinPrepCategory,
  LastMinPrepProgress,
  LastMinPrepQuestion,
} from './last-min-prep';

export type DesignPrepProgress = LastMinPrepProgress;

function q(leetcodeId: number, title: string): LastMinPrepQuestion {
  return {
    leetcodeId,
    title,
    difficulty: 'Medium',
    category: 'Design Questions',
    pattern: '',
  };
}

export const DESIGN_PREP_CATEGORIES: LastMinPrepCategory[] = [
  {
    id: 'design-questions',
    name: 'Design Questions',
    pattern: 'Curated design / OOP data-structure list',
    questions: [
      q(1603, 'Design Parking System'),
      q(2043, 'Simple Bank System'),
      q(1381, 'Design a Stack With Increment Operation'),
      q(225, 'Implement Stack using Queues'),
      q(641, 'Design Circular Deque'),
      q(1472, 'Design Browser History'),
      q(2069, 'Walking Robot Simulation II'),
      q(705, 'Design HashSet'),
      q(706, 'Design HashMap'),
      q(211, 'Design Add and Search Words Data Structure'),
      q(380, 'Insert Delete GetRandom O(1)'),
      q(1865, 'Finding Pairs With a Certain Sum'),
      q(1845, 'Seat Reservation Manager'),
      q(3092, 'Most Frequent IDs'),
      q(2349, 'Design a Number Container System'),
      q(2353, 'Design a Food Rating System'),
      q(3408, 'Design Task Manager'),
      q(1396, 'Design Underground System'),
      q(1146, 'Snapshot Array'),
      q(3484, 'Design Spreadsheet'),
      q(3508, 'Implement Router'),
      q(341, 'Flatten Nested List Iterator'),
      q(146, 'LRU Cache'),
      q(460, 'LFU Cache'),
      q(432, 'All O`one Data Structure'),
      q(1912, 'Design Movie Rental System'),
    ],
  },
];

export function getAllDesignPrepQuestions(): LastMinPrepQuestion[] {
  return DESIGN_PREP_CATEGORIES.flatMap((c) => c.questions);
}

const STORAGE_PREFIX = 'design_prep_';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadDesignPrepProgress(userId: string): DesignPrepProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
  } catch {
    return [];
  }
}

export function saveDesignPrepProgress(userId: string, rows: DesignPrepProgress[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(rows));
}
