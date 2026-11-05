import { describe, expect, it } from 'vitest'
import { activeAnnouncements, isLive, sortForCarousel, upcomingEvents } from './selectors'
import type { Announcement, CampusEvent } from './types'

const NOW = new Date('2026-11-05T12:00:00')

function event(patch: Partial<CampusEvent>): CampusEvent {
  return {
    id: 'e1',
    title: 'Evento',
    description: '',
    startsAt: '2026-11-05T10:00',
    endsAt: '2026-11-05T14:00',
    spaceId: 'A101',
    category: 'academic',
    priority: 'normal',
    published: true,
    createdAt: '2026-11-01T00:00:00',
    ...patch,
  }
}

function announcement(patch: Partial<Announcement>): Announcement {
  return {
    id: 'a1',
    message: 'Aviso',
    kind: 'info',
    startsAt: '2026-11-01T00:00',
    endsAt: '2026-11-10T00:00',
    published: true,
    ...patch,
  }
}

describe('isLive', () => {
  it('is true inside the window', () => {
    expect(
      isLive({ published: true, startsAt: '2026-11-01T00:00', endsAt: '2026-11-10T00:00' }, NOW),
    ).toBe(true)
  })

  it('is false before the window', () => {
    expect(
      isLive({ published: true, startsAt: '2026-11-06T00:00', endsAt: '2026-11-10T00:00' }, NOW),
    ).toBe(false)
  })

  it('is false after the window', () => {
    expect(
      isLive({ published: true, startsAt: '2026-11-01T00:00', endsAt: '2026-11-02T00:00' }, NOW),
    ).toBe(false)
  })

  it('is false when unpublished, whatever the dates', () => {
    expect(
      isLive({ published: false, startsAt: '2026-11-01T00:00', endsAt: '2026-11-10T00:00' }, NOW),
    ).toBe(false)
  })

  it('is false for an invalid date instead of throwing', () => {
    expect(
      isLive({ published: true, startsAt: 'no-es-fecha', endsAt: '2026-11-10T00:00' }, NOW),
    ).toBe(false)
  })
})

describe('upcomingEvents', () => {
  it('keeps ongoing and future events', () => {
    const list = upcomingEvents(
      [
        event({ id: 'ongoing' }),
        event({ id: 'future', startsAt: '2026-11-20T10:00', endsAt: '2026-11-20T12:00' }),
        event({ id: 'past', startsAt: '2026-11-01T10:00', endsAt: '2026-11-01T12:00' }),
      ],
      NOW,
    )
    expect(list.map((item) => item.id)).toEqual(['ongoing', 'future'])
  })

  it('drops unpublished events', () => {
    expect(upcomingEvents([event({ published: false })], NOW)).toHaveLength(0)
  })

  it('sorts by start time', () => {
    const list = upcomingEvents(
      [
        event({ id: 'late', startsAt: '2026-11-30T10:00', endsAt: '2026-11-30T12:00' }),
        event({ id: 'soon', startsAt: '2026-11-06T10:00', endsAt: '2026-11-06T12:00' }),
      ],
      NOW,
    )
    expect(list.map((item) => item.id)).toEqual(['soon', 'late'])
  })
})

describe('activeAnnouncements', () => {
  it('orders emergency before warning before info', () => {
    const list = activeAnnouncements(
      [
        announcement({ id: 'i', kind: 'info' }),
        announcement({ id: 'e', kind: 'emergency' }),
        announcement({ id: 'w', kind: 'warning' }),
      ],
      NOW,
    )
    expect(list.map((item) => item.id)).toEqual(['e', 'w', 'i'])
  })

  it('hides expired announcements', () => {
    const list = activeAnnouncements(
      [announcement({ id: 'old', startsAt: '2026-10-01T00:00', endsAt: '2026-10-02T00:00' })],
      NOW,
    )
    expect(list).toHaveLength(0)
  })
})

describe('sortForCarousel', () => {
  it('puts high priority first, then the soonest', () => {
    const sorted = sortForCarousel([
      event({ id: 'low', priority: 'low', startsAt: '2026-11-06T10:00' }),
      event({ id: 'high-late', priority: 'high', startsAt: '2026-11-20T10:00' }),
      event({ id: 'high-soon', priority: 'high', startsAt: '2026-11-07T10:00' }),
    ])
    expect(sorted.map((item) => item.id)).toEqual(['high-soon', 'high-late', 'low'])
  })
})
