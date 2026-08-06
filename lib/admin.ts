/** Hardcoded admin username for the users directory view. */
export const ADMIN_USERNAME = 'adminharikiran';

export function isAdminUsername(username: string): boolean {
  return username.trim().toLowerCase() === ADMIN_USERNAME;
}
