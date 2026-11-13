export interface HrContact {
  id: string;
  user_id: string;
  name: string;
  linkedin: string;
  phones: string[];
  emails: string[];
  role: string;
  company: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_PREFIX = 'hr_contacts_';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadHrContacts(userId: string): HrContact[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
  } catch {
    return [];
  }
}

export function saveHrContacts(userId: string, contacts: HrContact[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(contacts));
}

export function emptyHrContact(userId: string): HrContact {
  const now = new Date().toISOString();
  return {
    id: `hr-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    name: '',
    linkedin: '',
    phones: [],
    emails: [],
    role: '',
    company: '',
    created_at: now,
    updated_at: now,
  };
}
