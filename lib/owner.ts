/** The only account allowed to see/use owner-private features (e.g. HR Contacts). */
export const OWNER_USERNAME = 'harikiran';

export function isOwnerUsername(username: string): boolean {
  return username.trim().toLowerCase() === OWNER_USERNAME;
}
