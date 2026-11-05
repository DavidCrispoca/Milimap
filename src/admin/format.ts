/**
 * Date and label helpers for the admin console.
 *
 * Dates in content are stored as local "YYYY-MM-DDTHH:MM" strings, which is what
 * `datetime-local` inputs produce. Display uses Colombian Spanish.
 */

const DATE_TIME = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
const DATE_ONLY = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

export function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : DATE_TIME.format(date)
}

export function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : DATE_ONLY.format(date)
}

/** Default window for a new event: tomorrow, 10:00 to 12:00. */
export function defaultWindow(
  hoursLong = 2,
  daysAhead = 1,
  hour = 10,
): { start: string; end: string } {
  const start = new Date()
  start.setDate(start.getDate() + daysAhead)
  start.setHours(hour, 0, 0, 0)
  const end = new Date(start.getTime() + hoursLong * 60 * 60 * 1000)
  return { start: toLocalInput(start), end: toLocalInput(end) }
}

export function toLocalInput(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}
