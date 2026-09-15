import { UserProfile } from '../types';

// Local State Store Keys
const KEYS = {
  ACTIVE_USER: 'scholarflow_active_user_v2',
  SESSION_TOKEN: 'scholarflow_session_token_v1',
  DEVICE_ID: 'scholarflow_device_id_v1',
  DISPLACED_NOTICE: 'scholarflow_displaced_notice_v1',
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

/**
 * Retrieve the active session token stored locally.
 */
export function getStoredSessionToken(): string | null {
  return localStorage.getItem(KEYS.SESSION_TOKEN);
}

/**
 * Save or clear the active session token in localStorage.
 */
export function saveStoredSessionToken(token: string | null): void {
  if (token) {
    localStorage.setItem(KEYS.SESSION_TOKEN, token);
  } else {
    localStorage.removeItem(KEYS.SESSION_TOKEN);
  }
}

/**
 * Retrieve or store this device's persistent identifier.
 */
export function getStoredDeviceId(): string | null {
  return localStorage.getItem(KEYS.DEVICE_ID);
}

export function saveStoredDeviceId(deviceId: string): void {
  localStorage.setItem(KEYS.DEVICE_ID, deviceId);
}

/**
 * Flag to indicate the user was logged out because another device logged in.
 */
export function setDisplacedSessionNotice(message: string | null): void {
  if (message) {
    sessionStorage.setItem(KEYS.DISPLACED_NOTICE, message);
  } else {
    sessionStorage.removeItem(KEYS.DISPLACED_NOTICE);
  }
}

export function getDisplacedSessionNotice(): string | null {
  return sessionStorage.getItem(KEYS.DISPLACED_NOTICE);
}

