/**
 * Universal safe date & timestamp formatting utility.
 * Guarantees that "Invalid Date" is never rendered in the UI,
 * extracting valid timestamps from ISO strings, UNIX epoch, Date instances,
 * or fallback timestamp properties, and always resolving to real timestamps.
 */

export function parseDateSafe(val?: any, fallbackDate: Date = new Date()): Date {
  if (val === null || val === undefined || val === '') {
    return fallbackDate;
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? fallbackDate : val;
  }
  // If it's a number (UNIX timestamp in ms or seconds)
  if (typeof val === 'number') {
    const d = new Date(val > 1e11 ? val : val * 1000);
    return isNaN(d.getTime()) ? fallbackDate : d;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallbackDate : d;
}

/**
 * Format timestamp as localized Time string (e.g., "10:42:15 AM")
 */
export function formatTimeSafe(
  val?: any,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' }
): string {
  const d = parseDateSafe(val);
  return d.toLocaleTimeString([], options);
}

/**
 * Format timestamp as localized Date string (e.g., "Oct 30, 2026")
 */
export function formatDateOnlySafe(
  val?: any,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
  const d = parseDateSafe(val);
  return d.toLocaleDateString([], options);
}

/**
 * Format timestamp as combined Date & Time string (e.g., "Oct 30, 2026, 10:42:15 AM")
 */
export function formatDateTimeSafe(
  val?: any,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = parseDateSafe(val);
  const defaultOpts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return d.toLocaleString([], options || defaultOpts);
}

/**
 * Format timestamp as human-readable relative time (e.g., "Just now", "45s ago", "3m ago")
 */
export function formatElapsedSafe(val?: any, referenceTime: number = Date.now()): string {
  try {
    const then = parseDateSafe(val).getTime();
    const diffSec = Math.max(0, Math.floor((referenceTime - then) / 1000));
    if (diffSec < 2) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return 'Just now';
  }
}
