export type LldStatus = 'todo' | 'done' | 'revise';

export interface LldTopic {
  id: string;
  title: string;
  focus: string;
}

export interface LldProgress {
  topic_id: string;
  user_id: string;
  status: LldStatus;
  notes: string;
  updated_at: string;
}

export const LLD_TOPICS: LldTopic[] = [
  { id: 'lru-cache', title: 'LRU Cache', focus: 'HashMap + Doubly Linked List, O(1) get/put' },
  { id: 'parking-lot', title: 'Parking Lot', focus: 'Levels, spots, vehicle types, allocation strategy' },
  { id: 'amazon-locker', title: 'Amazon Locker', focus: 'Locker sizes, package assignment, pickup codes' },
  { id: 'shopping-cart', title: 'Shopping Cart', focus: 'Cart items, pricing, discounts, inventory sync' },
  { id: 'rate-limiter', title: 'Rate Limiter', focus: 'Token bucket / sliding window / leaky bucket' },
  { id: 'elevator', title: 'Elevator', focus: 'Requests, scheduling, multi-elevator controller' },
  { id: 'splitwise', title: 'Splitwise', focus: 'Balances, settle-up, simplify debts' },
  { id: 'vending-machine', title: 'Vending Machine', focus: 'State machine, inventory, payments' },
  { id: 'bookmyshow', title: 'BookMyShow', focus: 'Seats, locking, bookings, showtimes' },
  { id: 'notification-system', title: 'Notification System', focus: 'Channels, templates, fan-out, retries' },
  { id: 'google-docs', title: 'Google Docs', focus: 'Collaborative editing, OT/CRDT, presence' },
  { id: 'zomato', title: 'Zomato', focus: 'Restaurants, orders, delivery tracking, ratings' },
];

function storageKey(userId: string): string {
  return `lld_progress_${userId}`;
}

export function emptyLldProgress(userId: string, topicId: string): LldProgress {
  return {
    topic_id: topicId,
    user_id: userId,
    status: 'todo',
    notes: '',
    updated_at: new Date().toISOString(),
  };
}

export function loadLldProgress(userId: string): LldProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
  } catch {
    return [];
  }
}

export function saveLldProgress(userId: string, rows: LldProgress[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(rows));
}

export function mergeLldProgress(local: LldProgress[], remote: LldProgress[]): LldProgress[] {
  const map = new Map<string, LldProgress>();
  for (const row of [...local, ...remote]) {
    const existing = map.get(row.topic_id);
    if (!existing || row.updated_at > existing.updated_at) {
      map.set(row.topic_id, row);
    }
  }
  return Array.from(map.values());
}

export function lldProgressMap(rows: LldProgress[]): Map<string, LldProgress> {
  const map = new Map<string, LldProgress>();
  for (const row of rows) map.set(row.topic_id, row);
  return map;
}

export function getLldStats(rows: LldProgress[], total = LLD_TOPICS.length) {
  const map = lldProgressMap(rows);
  let done = 0;
  let revise = 0;
  for (const topic of LLD_TOPICS) {
    const status = map.get(topic.id)?.status ?? 'todo';
    if (status === 'done') done++;
    else if (status === 'revise') revise++;
  }
  return { done, revise, todo: Math.max(0, total - done - revise), total };
}
