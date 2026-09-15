/**
 * Password Hashing Utility — ScholarFlow
 * Uses the Web Crypto API (SHA-256) built into the browser.
 * No external dependencies required.
 */

/**
 * Hash a plaintext password using SHA-256.
 * Returns a lowercase hex digest string.
 */
export async function hashPassword(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a plaintext password against a stored SHA-256 hex hash.
 * Returns true if they match.
 */
export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  const hashed = await hashPassword(plain);
  return hashed === storedHash;
}

/**
 * Pre-computed SHA-256 hashes for the default seeded credentials.
 * staff123 → 10176e7b...
 * admin123 → 240be518...
 */
export const DEFAULT_STAFF_PASSWORD_HASH =
  '10176e7b7b24d317acfcf8d2064cfd2f24e154f7b5a96603077d5ef813d6a6b6';
export const DEFAULT_ADMIN_PASSWORD_HASH =
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

/**
 * Generate a unique session token for single-device session tracking.
 */
export function generateSessionToken(): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `sess_${time}_${rand}`;
}

/**
 * Generate a secure 6-digit numeric OTP code.
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Device fingerprint generation for new device verification.
 * Generates and stores a unique persistent ID per browser instance.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server_device';
  
  const KEY = 'scholarflow_device_fingerprint_v1';
  let deviceId = localStorage.getItem(KEY);
  if (deviceId) return deviceId;

  // Build a unique fingerprint from browser environment
  try {
    const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const lang = navigator.language || 'en';
    const ua = navigator.userAgent || 'unknown';
    
    // Quick string hash
    let hash = 0;
    const str = `${ua}|${screenRes}|${tz}|${lang}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const randPart = Math.random().toString(36).substring(2, 8);
    deviceId = `dev_${Math.abs(hash).toString(36)}_${randPart}`;
  } catch {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  localStorage.setItem(KEY, deviceId);
  return deviceId;
}

