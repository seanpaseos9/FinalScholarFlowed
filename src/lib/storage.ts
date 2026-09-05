import { UserProfile } from '../types';

// Local State Store Keys
const KEYS = {
  ACTIVE_USER: 'scholarflow_active_user_v2',
};

/**
 * Retrieve the currently logged-in user from localStorage.
 * Returns null if no user is stored or if parsing fails.
 */
export function getStoredActiveUser(): UserProfile | null {
  const data = localStorage.getItem(KEYS.ACTIVE_USER);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Persist the active user to localStorage for session continuity.
 * Pass null to clear the stored session (logout).
 */
export function saveStoredActiveUser(user: UserProfile | null): void {
  if (user) {
    localStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.ACTIVE_USER);
  }
}
