/**
 * Derived views over stored content.
 *
 * Pure functions receiving "now" as a parameter, never reading the clock
 * themselves. That is what makes "does this event show up today?" testable
 * without freezing time.
 */

import type { Announcement, CampusEvent, EventPriority } from './types'

/** Is the item published and inside its validity window? */
export function isLive(
  item: { published: boolean; startsAt: string; endsAt: string },
  now: Date,
): boolean {
  if (!item.published) return false
  const start = new Date(item.startsAt).getTime()
  const end = new Date(item.endsAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  return now.getTime() >= start && now.getTime() <= end
}

/** Events that have not finished yet, sorted by start. Future and ongoing both count. */
export function upcomingEvents(events: readonly CampusEvent[], now: Date): CampusEvent[] {
  return events
    .filter((event) => {
      if (!event.published) return false
      const end = new Date(event.endsAt).getTime()
      return !Number.isNaN(end) && end >= now.getTime()
    })
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
}

/** Announcements currently valid, most urgent first. */
export function activeAnnouncements(
  announcements: readonly Announcement[],
  now: Date,
): Announcement[] {
  const weight: Record<Announcement['kind'], number> = {
    emergency: 0,
    warning: 1,
    info: 2,
  }

  return announcements
    .filter((item) => isLive(item, now))
    .sort((a, b) => weight[a.kind] - weight[b.kind])
}

const PRIORITY_WEIGHT: Record<EventPriority, number> = { high: 0, normal: 1, low: 2 }

/** Order for the home carousel: high priority first, then soonest. */
export function sortForCarousel(events: readonly CampusEvent[]): CampusEvent[] {
  return [...events].sort((a, b) => {
    const byPriority = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
    if (byPriority !== 0) return byPriority
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  })
}
