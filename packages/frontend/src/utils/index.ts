import { format, formatDistanceToNow, isAfter } from 'date-fns';

/**
 * Format a date/time for display in the UI.
 * @param date - ISO date string or Date
 * @returns Human-readable date string
 */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'PPpp');
}

/**
 * Format a date for display (date only).
 * @param date - ISO date string or Date
 * @returns Human-readable date string (date only)
 */
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'PP');
}

/**
 * Get a relative time string (e.g. "3 hours ago").
 * @param date - ISO date string or Date
 * @returns Relative time string
 */
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Returns true if the date is in the future.
 * @param date - ISO date string or Date
 */
export function isFuture(date: string | Date): boolean {
  return isAfter(new Date(date), new Date());
}

/**
 * Map adherence status to accessible color class names.
 * @param status - Adherence status string
 * @returns Tailwind color class string
 */
export function getAdherenceColor(status: string): string {
  const colorMap: Record<string, string> = {
    taken: 'text-green-700 bg-green-100 border-green-300',
    skipped: 'text-yellow-700 bg-yellow-100 border-yellow-300',
    missed: 'text-red-700 bg-red-100 border-red-300',
    pending: 'text-blue-700 bg-blue-100 border-blue-300',
  };
  return colorMap[status] ?? 'text-gray-700 bg-gray-100 border-gray-300';
}

/**
 * Map severity level to accessible color.
 * @param severity - Severity string ('none' | 'mild' | 'moderate' | 'severe')
 * @returns Tailwind text color class
 */
export function getSeverityColor(severity: string): string {
  const colorMap: Record<string, string> = {
    none: 'text-green-700',
    mild: 'text-yellow-600',
    moderate: 'text-orange-600',
    severe: 'text-red-700',
  };
  return colorMap[severity] ?? 'text-gray-600';
}

/**
 * Debounce a function call.
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced version of fn
 */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

/**
 * Generate a random profile ID for new shared profiles.
 * @returns A unique profile ID string
 */
export function generateProfileId(): string {
  return `profile-${Math.random().toString(36).substring(2, 11)}`;
}
