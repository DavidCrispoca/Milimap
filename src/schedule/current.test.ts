import { describe, expect, it } from 'vitest'
import { scheduleFor } from './demo'
import { bogotaClock, findCurrentClass, findNextClass } from './current'

// Fixture: Ingeniería de Sistemas, group A.
const classes = scheduleFor('ing-sistemas', 'A')

// Bogotá is UTC-5 (no DST). These ISO strings are chosen so the local Bogotá
// time is a round value for assertions.
// 2026-11-09 is a Monday (per the plan's calendar).

function at(bogotaLocal: string): Date {
  // Append the fixed Bogotá offset to build an absolute instant.
  return new Date(`${bogotaLocal}-05:00`)
}

describe('schedule/current bogotaClock', () => {
  it('reads a Monday morning in Bogotá', () => {
    const clock = bogotaClock(at('2026-11-09T08:00:00'))
    expect(clock.weekday).toBe(1)
    expect(clock.minutes).toBe(8 * 60)
  })

  it('maps Saturday to 6', () => {
    // 2026-11-14 is a Saturday.
    const clock = bogotaClock(at('2026-11-14T12:00:00'))
    expect(clock.weekday).toBe(6)
  })
})

describe('schedule/current findCurrentClass', () => {
  it('finds the class running right now', () => {
    const now = at('2026-11-09T08:00:00') // Monday 08:00 → SIS-101 (07:00–08:50)
    expect(findCurrentClass(classes, now)?.subject).toBe('Programación I')
  })

  it('returns null between classes', () => {
    const now = at('2026-11-09T08:55:00') // SIS-101 ended 08:50, SIS-102 starts 09:00
    expect(findCurrentClass(classes, now)).toBeNull()
  })

  it('treats the end time as exclusive', () => {
    const now = at('2026-11-09T08:50:00')
    expect(findCurrentClass(classes, now)).toBeNull()
  })

  it('returns null on a day with no classes', () => {
    const now = at('2026-11-15T10:00:00') // Sunday
    expect(findCurrentClass(classes, now)).toBeNull()
  })
})

describe('schedule/current findNextClass', () => {
  it('finds the next class later the same day', () => {
    const now = at('2026-11-09T08:00:00') // Monday → next is Cálculo I at 09:00
    expect(findNextClass(classes, now)?.subject).toBe('Cálculo I')
  })

  it('wraps to the next week from late Friday', () => {
    const now = at('2026-11-13T18:00:00') // Friday evening → next is Monday SIS-101
    expect(findNextClass(classes, now)?.subject).toBe('Programación I')
  })

  it('returns null for an empty schedule', () => {
    expect(findNextClass([], at('2026-11-09T08:00:00'))).toBeNull()
  })
})
