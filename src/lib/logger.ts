/**
 * ScholarFlow — Session-Scoped Activity Logger
 * Stores audit log entries in sessionStorage for the current browser session.
 * Entries are cleared when the browser tab is closed.
 */

export type LogSeverity = 'Info' | 'Warning' | 'Security' | 'System';

export interface LogEntry {
  id: string;
  timestamp: string;          // ISO string
  severity: LogSeverity;
  category: string;           // e.g. 'Authentication', 'Scholarship', 'Application', 'Freeze'
  message: string;
}

const STORAGE_KEY = 'scholarflow_session_logs';
const MAX_ENTRIES = 500;

function readLogs(): LogEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLogs(logs: LogEntry[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Ignore quota errors silently
  }
}

/**
 * Append an audit log entry for the current session.
 */
export function logEvent(
  severity: LogSeverity,
  category: string,
  message: string
): void {
  const logs = readLogs();
  const entry: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    severity,
    category,
    message,
  };

  // Prepend new entry (newest first), cap at MAX_ENTRIES
  logs.unshift(entry);
  if (logs.length > MAX_ENTRIES) logs.splice(MAX_ENTRIES);
  writeLogs(logs);
}

/**
 * Retrieve all stored log entries (newest first).
 */
export function getLogs(): LogEntry[] {
  return readLogs();
}

/**
 * Clear all session log entries.
 */
export function clearLogs(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Export logs as a downloadable CSV string.
 */
export function exportLogsAsCSV(): string {
  const logs = readLogs();
  const header = 'Timestamp,Severity,Category,Message';
  const rows = logs.map(
    (l) =>
      `"${l.timestamp}","${l.severity}","${l.category}","${l.message.replace(/"/g, '""')}"`
  );
  return [header, ...rows].join('\n');
}
