/** Admin account for the control panel. */
export const ADMIN_USERNAME = 'adminharikiran';

/**
 * Extra PIN required for admin API actions (stronger than username alone).
 * Entered once per browser session in the admin UI.
 */
export const ADMIN_PIN = 'hari@admin2026';

export const ADMIN_PIN_STORAGE_KEY = 'admin_pin_verified';

export type AdminResetScope =
  | 'problems'
  | 'lastmin'
  | 'lld'
  | 'day100'
  | 'todos'
  | 'all';

export type AdminAuditAction =
  | 'view_overview'
  | 'view_user'
  | 'reset'
  | 'hide_leaderboard'
  | 'unhide_leaderboard'
  | 'export_csv';

export interface AdminUserRow {
  id: string;
  username: string;
  created_at: string;
  lastSeen: string | null;
  problemsDone: number;
  problemsRevise: number;
  problemsTotalTracked: number;
  lastMinDone: number;
  lastMinRevise: number;
  lldDone: number;
  day100Days: number;
  todosDone: number;
  inactive: boolean;
  hiddenFromLeaderboard: boolean;
  leakRisk: boolean;
}

export interface AdminLeakPair {
  userAId: string;
  userA: string;
  userBId: string;
  userB: string;
  sharedDone: number;
  similarity: number;
}

export interface AdminGlobalStats {
  totalUsers: number;
  activeWeek: number;
  inactiveUsers: number;
  avgProblemsDone: number;
  totalProblemsDone: number;
  hiddenUsers: number;
  leakPairs: number;
}

export interface AdminAuditEntry {
  id: string;
  admin: string;
  action: AdminAuditAction;
  target_user_id?: string;
  target_username?: string;
  detail?: string;
  created_at: string;
}

export interface AdminUserDetail {
  user: AdminUserRow;
  recentProblems: {
    question_id: number;
    question_title?: string;
    status: string;
    updated_at: string;
  }[];
  recentLastMin: {
    leetcode_id: number;
    status: string;
    updated_at: string;
  }[];
  recentLld: {
    topic_id: string;
    status: string;
    updated_at: string;
  }[];
}

export interface AdminOverview {
  stats: AdminGlobalStats;
  users: AdminUserRow[];
  leaks: AdminLeakPair[];
  audit: AdminAuditEntry[];
}

export function isAdminUsername(username: string): boolean {
  return username.trim().toLowerCase() === ADMIN_USERNAME;
}

export function isValidAdminPin(pin: string): boolean {
  return pin.trim() === ADMIN_PIN;
}

export function assertAdminAccess(admin: string | null, pin: string | null): boolean {
  return isAdminUsername(admin ?? '') && isValidAdminPin(pin ?? '');
}
