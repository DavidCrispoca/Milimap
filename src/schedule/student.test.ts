import { describe, expect, it } from 'vitest'
import {
  STUDENT_SCHEDULE_KEY,
  clearStudentSchedule,
  exportStudentSchedule,
  importStudentSchedule,
  loadStudentSchedule,
  parseStudentSchedule,
  saveStudentSchedule,
  type StorageLike,
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

const sample = {
  version: 1 as const,
  programId: 'ing-sistemas',
  groupId: 'A',
  selectedClassIds: ['a', 'b'],
  updatedAt: '2026-11-09T00:00:00.000Z',
}

describe('schedule/student parseStudentSchedule', () => {
  it('accepts a valid schedule', () => {
    expect(parseStudentSchedule(sample)).toEqual(sample)
  })

  it('rejects a wrong version', () => {
    expect(parseStudentSchedule({ ...sample, version: 2 })).toBeNull()
  })

  it('rejects a malformed selectedClassIds', () => {
    expect(parseStudentSchedule({ ...sample, selectedClassIds: 'nope' })).toBeNull()
  })

  it('rejects null and non-objects', () => {
    expect(parseStudentSchedule(null)).toBeNull()
    expect(parseStudentSchedule('x')).toBeNull()
  })
})

describe('schedule/student persistence round-trip', () => {
  it('saves and loads through storage', () => {
    const storage = memoryStorage()
    saveStudentSchedule(storage, sample)
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

  it('clears the stored schedule', () => {
    const storage = memoryStorage()
    saveStudentSchedule(storage, sample)
    clearStudentSchedule(storage)
    expect(loadStudentSchedule(storage)).toBeNull()
  })

  it('no-ops when storage is unavailable', () => {
    expect(loadStudentSchedule(null)).toBeNull()
    expect(() => saveStudentSchedule(null, sample)).not.toThrow()
    expect(() => clearStudentSchedule(null)).not.toThrow()
  })
})

describe('schedule/student export/import', () => {
  it('round-trips through JSON text', () => {
    const text = exportStudentSchedule(sample)
    expect(importStudentSchedule(text)).toEqual(sample)
  })

  it('rejects malformed import text', () => {
    expect(importStudentSchedule('garbage')).toBeNull()
  })
})
