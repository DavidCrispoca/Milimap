/**
 * Student schedule persistence (Phase 6).
 *
 * The student's selection is stored on-device (localStorage), never on a server,
 * so no account is required. Storage is injectable so the logic is testable and
 * can later swap to IndexedDB or a backend without touching the UI.
 *
 * Stored shape stores *references* (program + group + selected class ids), not
 * full class objects: the classes themselves are derived from the public catalog,
 * which can change per term without invalidating the student's file.
 */

export interface StudentSchedule {
  version: 1
  programId: string
  groupId: string
  selectedClassIds: string[]
  updatedAt: string
}

/** Minimal storage contract (satisfied by localStorage). */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const STUDENT_SCHEDULE_KEY = 'milimap.schedule.v1'
export const STUDENT_SCHEDULE_VERSION = 1

/** Default storage: browser localStorage, guarded for non-browser environments. */
export function defaultStorage(): StorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/** Validate and normalize an untrusted value into a StudentSchedule, or null. */
export function parseStudentSchedule(value: unknown): StudentSchedule | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>

  if (record.version !== STUDENT_SCHEDULE_VERSION) return null
  if (typeof record.programId !== 'string') return null
  if (typeof record.groupId !== 'string') return null
  if (!isStringArray(record.selectedClassIds)) return null

  return {
    version: STUDENT_SCHEDULE_VERSION,
    programId: record.programId,
    groupId: record.groupId,
    selectedClassIds: record.selectedClassIds,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
  }
}

/** Read the stored schedule. Returns null when absent or invalid (no throw). */
export function loadStudentSchedule(storage: StorageLike | null): StudentSchedule | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(STUDENT_SCHEDULE_KEY)
    if (!raw) return null
    return parseStudentSchedule(JSON.parse(raw))
  } catch {
    return null
  }
}

/** Persist a schedule. Never throws. */
export function saveStudentSchedule(storage: StorageLike | null, schedule: StudentSchedule): void {
  if (!storage) return
  try {
    storage.setItem(STUDENT_SCHEDULE_KEY, JSON.stringify(schedule))
  } catch {
    /* storage full or unavailable: the app keeps working, just without persistence */
  }
}

export function clearStudentSchedule(storage: StorageLike | null): void {
  if (!storage) return
  try {
    storage.removeItem(STUDENT_SCHEDULE_KEY)
  } catch {
    /* ignore */
  }
}

/** Serialize for sharing/moving to another device. */
export function exportStudentSchedule(schedule: StudentSchedule): string {
  return JSON.stringify(schedule, null, 2)
}

/** Parse an exported schedule. Returns null on any malformed input. */
export function importStudentSchedule(text: string): StudentSchedule | null {
  try {
    return parseStudentSchedule(JSON.parse(text))
  } catch {
    return null
  }
}
