/**
 * "Mi horario" — the pure schedule engine.
 *
 * Computes which class is happening *right now* and which comes *next*, in the
 * America/Bogota timezone (the campus is in Bogotá, UTC-5, no DST). Kept free of
 * React and localStorage so it is fully testable.
 *
 * Weekday convention follows `content/types.ts`: 1 = Monday … 6 = Saturday.
 * JavaScript's `getDay()` puts Sunday at 0; Monday..Saturday are identical in
 * both conventions, and Sunday simply has no classes here.
 */

import { minutesOf } from './csv'
import type { ScheduleClass } from '@/content/types'

/** A clock reading in the campus timezone. */
export interface BogotaClock {
  /** 1 = Monday … 6 = Saturday, 7 = Sunday. */
  weekday: number
  /** Minutes since midnight, local Bogotá time. */
  minutes: number
}

const WEEKDAY_MAP: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
}

/** Read `date` in America/Bogota as weekday + minutes since midnight. */
export function bogotaClock(date: Date): BogotaClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  let weekday = 7
  let hour = 0
  let minute = 0

  for (const part of parts) {
    if (part.type === 'weekday') weekday = WEEKDAY_MAP[part.value] ?? 7
    else if (part.type === 'hour') hour = part.value === '24' ? 0 : Number(part.value)
    else if (part.type === 'minute') minute = Number(part.value)
  }

  return { weekday, minutes: hour * 60 + minute }
}

/** The class happening right now in Bogotá, or null. */
export function findCurrentClass(
  classes: readonly ScheduleClass[],
  now: Date,
): ScheduleClass | null {
  const clock = bogotaClock(now)

  const candidates = classes.filter((item) => item.weekday === clock.weekday)
  for (const item of candidates) {
    if (clock.minutes >= minutesOf(item.startsAt) && clock.minutes < minutesOf(item.endsAt)) {
      return item
    }
  }
  return null
}

/**
 * The next class strictly after `now`, across the whole week. Returns null when
 * there is nothing ahead (empty schedule).
 */
export function findNextClass(classes: readonly ScheduleClass[], now: Date): ScheduleClass | null {
  if (classes.length === 0) return null
  const clock = bogotaClock(now)

  let best: ScheduleClass | null = null
  let bestDelta = Infinity

  for (const item of classes) {
    const start = minutesOf(item.startsAt)
    let delta: number

    if (item.weekday === clock.weekday) {
      delta = start - clock.minutes
    } else if (item.weekday > clock.weekday) {
      delta = (item.weekday - clock.weekday) * 1440 + start - clock.minutes
    } else {
      // Earlier weekday → it wraps into next week.
      delta = (7 - clock.weekday + item.weekday) * 1440 + start - clock.minutes
    }

    // Strictly in the future only.
    if (delta <= 0) continue
    if (delta < bestDelta) {
      bestDelta = delta
      best = item
    }
  }

  return best
}

/** Minutes until a class starts, from `now`. 0 when it is already running. */
export function minutesUntil(item: ScheduleClass, now: Date): number {
  const clock = bogotaClock(now)
  const start = minutesOf(item.startsAt)

  let delta: number
  if (item.weekday === clock.weekday) {
    delta = start - clock.minutes
  } else if (item.weekday > clock.weekday) {
    delta = (item.weekday - clock.weekday) * 1440 + start - clock.minutes
  } else {
    delta = (7 - clock.weekday + item.weekday) * 1440 + start - clock.minutes
  }

  return Math.max(0, delta)
}
