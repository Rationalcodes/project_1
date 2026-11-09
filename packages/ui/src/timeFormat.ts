/**
 * Formats any duration or wait time in minutes into a human-readable "hr and min" format.
 * Examples:
 *   190 -> "3 hr 10 min"
 *   60  -> "1 hr"
 *   120 -> "2 hr"
 *   45  -> "45 min"
 *   1   -> "1 min"
 *   0   -> "0 min"
 */
export function formatDuration(minutes: number | string | null | undefined): string {
  const num = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
  if (num == null || isNaN(num) || num <= 0) {
    return '0 min';
  }
  const total = Math.round(num);
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

/**
 * Formats wait time with an optional tilde '~' prefix if positive.
 * Examples:
 *   190 -> "~3 hr 10 min"
 *   60  -> "~1 hr"
 *   25  -> "~25 min"
 *   0   -> "0 min"
 */
export function formatWaitTime(minutes: number | string | null | undefined): string {
  const num = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
  if (num == null || isNaN(num) || num <= 0) {
    return '0 min';
  }
  return `~${formatDuration(num)}`;
}
