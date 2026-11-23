import { describe, expect, it } from 'vitest'
import type { SpaceId } from '@/domain/types'
import { scheduleFor } from './demo'
import {
  LEGACY_STUDENT_SCHEDULE_KEY,
  STUDENT_SCHEDULE_KEY,
  clearStudentSchedule,
  loadStudentSchedule,
  parseStudentClass,
  parseStudentSchedule,
  saveStudentSchedule,
  type StorageLike,
  type StudentSchedule,
} from './student'

/** Minimal in-memory storage for tests. */
function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

const sample: StudentSchedule = {
  version: 2,
  classes: [
    {
      id: 'c1',
      weekday: 2,
      startsAt: '07:00',
      endsAt: '08:50',
      subject: 'Cálculo diferencial',
      room: 'Aula B 101',
      spaceId: 'AULA-B101' as SpaceId,
    },
    {
      id: 'c2',
      weekday: 4,
      startsAt: '10:00',
      endsAt: '11:50',
      subject: 'Física',
      room: 'Salón por confirmar',
      spaceId: null,
    },
  ],
  updatedAt: '2026-11-09T00:00:00.000Z',
}

describe('schedule/student parseStudentClass', () => {
  it('accepts a complete class', () => {
    expect(parseStudentClass(sample.classes[0])).toEqual(sample.classes[0])
  })

  it('trims the subject and room', () => {
    const parsed = parseStudentClass({
      ...sample.classes[0],
      subject: '  Cálculo  ',
      room: ' Aula B 101 ',
    })
    expect(parsed?.subject).toBe('Cálculo')
    expect(parsed?.room).toBe('Aula B 101')
  })

  it('rejects a missing subject or room', () => {
    expect(parseStudentClass({ ...sample.classes[0], subject: '   ' })).toBeNull()
    expect(parseStudentClass({ ...sample.classes[0], room: '' })).toBeNull()
  })

  it('rejects an invalid weekday', () => {
    expect(parseStudentClass({ ...sample.classes[0], weekday: 0 })).toBeNull()
    expect(parseStudentClass({ ...sample.classes[0], weekday: 7 })).toBeNull()
    expect(parseStudentClass({ ...sample.classes[0], weekday: 1.5 })).toBeNull()
  })

  it('rejects malformed or inverted times', () => {
    expect(parseStudentClass({ ...sample.classes[0], startsAt: '7:00' })).toBeNull()
    expect(parseStudentClass({ ...sample.classes[0], endsAt: '25:00' })).toBeNull()
    expect(
      parseStudentClass({ ...sample.classes[0], startsAt: '09:00', endsAt: '09:00' }),
    ).toBeNull()
    expect(
      parseStudentClass({ ...sample.classes[0], startsAt: '10:00', endsAt: '09:00' }),
    ).toBeNull()
  })

  it('rejects a non-string space id', () => {
    expect(parseStudentClass({ ...sample.classes[0], spaceId: 42 })).toBeNull()
  })

  it('rejects null and non-objects', () => {
    expect(parseStudentClass(null)).toBeNull()
    expect(parseStudentClass('x')).toBeNull()
  })
})

describe('schedule/student parseStudentSchedule', () => {
  it('accepts a valid schedule', () => {
    expect(parseStudentSchedule(sample)).toEqual(sample)
  })

  it('rejects an unknown version', () => {
    expect(parseStudentSchedule({ ...sample, version: 3 })).toBeNull()
  })

  it('rejects a malformed classes list', () => {
    expect(parseStudentSchedule({ ...sample, classes: 'nope' })).toBeNull()
    expect(
      parseStudentSchedule({ ...sample, classes: [sample.classes[0], { id: 'x' }] }),
    ).toBeNull()
  })

  it('rejects null and non-objects', () => {
    expect(parseStudentSchedule(null)).toBeNull()
    expect(parseStudentSchedule('x')).toBeNull()
  })

  it('migrates a version 1 program selection', () => {
    const first = scheduleFor('ing-sistemas', 'A')[0]
    const migrated = parseStudentSchedule({
      version: 1,
      programId: 'ing-sistemas',
      groupId: 'A',
      selectedClassIds: [first?.id],
      updatedAt: '2026-11-09T00:00:00.000Z',
    })

    expect(migrated?.version).toBe(2)
    expect(migrated?.classes).toHaveLength(1)
    expect(migrated?.classes[0]).toMatchObject({
      weekday: first?.weekday,
      startsAt: first?.startsAt,
      endsAt: first?.endsAt,
      subject: first?.subject,
      room: first?.spaceId,
      spaceId: first?.spaceId,
    })
  })
})

describe('schedule/student persistence round-trip', () => {
  it('saves and loads through storage', () => {
    const storage = memoryStorage()
    saveStudentSchedule(storage, sample)
    expect(storage.getItem(STUDENT_SCHEDULE_KEY)).not.toBeNull()
    expect(loadStudentSchedule(storage)).toEqual(sample)
  })

  it('returns null when nothing is stored', () => {
    expect(loadStudentSchedule(memoryStorage())).toBeNull()
  })

  it('returns null on corrupted JSON', () => {
    const storage = memoryStorage()
    storage.setItem(STUDENT_SCHEDULE_KEY, '{not json')
    expect(loadStudentSchedule(storage)).toBeNull()
  })

  it('reads a legacy key, migrates it and removes it', () => {
    const first = scheduleFor('econ', 'B')[0]
    const storage = memoryStorage()
    storage.setItem(
      LEGACY_STUDENT_SCHEDULE_KEY,
      JSON.stringify({
        version: 1,
        programId: 'econ',
        groupId: 'B',
        selectedClassIds: [first?.id],
        updatedAt: '2026-11-09T00:00:00.000Z',
      }),
    )

    const loaded = loadStudentSchedule(storage)
    expect(loaded?.version).toBe(2)
    expect(loaded?.classes).toHaveLength(1)
    expect(storage.getItem(LEGACY_STUDENT_SCHEDULE_KEY)).toBeNull()
    expect(storage.getItem(STUDENT_SCHEDULE_KEY)).not.toBeNull()
  })

  it('clears the stored schedule and the legacy key', () => {
    const storage = memoryStorage()
    saveStudentSchedule(storage, sample)
    storage.setItem(LEGACY_STUDENT_SCHEDULE_KEY, '{}')
    clearStudentSchedule(storage)
    expect(loadStudentSchedule(storage)).toBeNull()
    expect(storage.getItem(LEGACY_STUDENT_SCHEDULE_KEY)).toBeNull()
  })

  it('no-ops when storage is unavailable', () => {
    expect(loadStudentSchedule(null)).toBeNull()
    expect(() => saveStudentSchedule(null, sample)).not.toThrow()
    expect(() => clearStudentSchedule(null)).not.toThrow()
  })
})
