/**
 * Student schedule persistence (Phase 6).
 *
 * The student's schedule is stored on-device (localStorage), never on a server,
 * so no account is required. Storage is injectable so the logic is testable and
 * can later swap to IndexedDB or a backend without touching the UI.
 *
 * The stored shape holds the classes the student typed in the form — day, time,
 * subject and room — not references to a catalog. The public catalog is only
 * used to resolve a room name into a space id, which is what enables "Cómo
 * llegar"; a room outside the map is still saved by name.
 */

import type { SpaceId } from '@/domain/types'
import { scheduleFor } from './demo'

export interface StudentClass {
  id: string
  /** 1 = Monday … 6 = Saturday. */
  weekday: number
  /** "HH:MM" 24h. */
  startsAt: string
  endsAt: string
  subject: string
  /** Room exactly as the student wrote it. */
  room: string
  /** Campus space id when the room matched the catalog; null otherwise. */
  spaceId: SpaceId | null
}

export interface StudentSchedule {
  version: 2
  classes: StudentClass[]
  updatedAt: string
}

/** Minimal storage contract (satisfied by localStorage). */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const STUDENT_SCHEDULE_KEY = 'milimap.schedule.v2'
/** Version 1 stored program + group references; read once and migrated. */
export const LEGACY_STUDENT_SCHEDULE_KEY = 'milimap.schedule.v1'
export const STUDENT_SCHEDULE_VERSION = 2

/** Default storage: browser localStorage, guarded for non-browser environments. */
export function defaultStorage(): StorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isWeekday(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6
}

/** "HH:MM" in 24h, the same format the time inputs produce. */
export function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

/** Validate and normalize one untrusted class entry, or null. */
export function parseStudentClass(value: unknown): StudentClass | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>

  if (typeof record.id !== 'string' || record.id.trim() === '') return null
  if (!isWeekday(record.weekday)) return null
  if (!isTime(record.startsAt) || !isTime(record.endsAt)) return null
  if (record.startsAt >= record.endsAt) return null
  if (typeof record.subject !== 'string' || record.subject.trim() === '') return null
  if (typeof record.room !== 'string' || record.room.trim() === '') return null

  const spaceId = record.spaceId
  if (spaceId !== null && typeof spaceId !== 'string') return null

  return {
    id: record.id,
    weekday: record.weekday,
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    subject: record.subject.trim(),
    room: record.room.trim(),
    spaceId: (spaceId ?? null) as SpaceId | null,
  }
}

/** Expand a version 1 selection (program + group + class ids) into v2 classes. */
function migrateLegacy(record: Record<string, unknown>): StudentSchedule | null {
  if (typeof record.programId !== 'string') return null
  if (typeof record.groupId !== 'string') return null
  if (!isStringArray(record.selectedClassIds)) return null

  const selected = new Set(record.selectedClassIds)
  const classes: StudentClass[] = scheduleFor(record.programId, record.groupId)
    .filter((item) => selected.has(item.id))
    .map((item) => ({
      id: item.id,
      weekday: item.weekday,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      subject: item.subject,
      room: item.spaceId,
      spaceId: item.spaceId,
    }))

  return {
    version: STUDENT_SCHEDULE_VERSION,
    classes,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
  }
}

/** Validate and normalize an untrusted value into a StudentSchedule, or null. */
export function parseStudentSchedule(value: unknown): StudentSchedule | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>

  if (record.version === 1) return migrateLegacy(record)
  if (record.version !== STUDENT_SCHEDULE_VERSION) return null
  if (!Array.isArray(record.classes)) return null

  const classes: StudentClass[] = []
  for (const item of record.classes) {
    const parsed = parseStudentClass(item)
    if (!parsed) return null
    classes.push(parsed)
  }

  return {
    version: STUDENT_SCHEDULE_VERSION,
    classes,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
  }
}

/** Read the stored schedule. Returns null when absent or invalid (no throw). */
export function loadStudentSchedule(storage: StorageLike | null): StudentSchedule | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(STUDENT_SCHEDULE_KEY)
    if (raw) return parseStudentSchedule(JSON.parse(raw))

    const legacyRaw = storage.getItem(LEGACY_STUDENT_SCHEDULE_KEY)
    if (!legacyRaw) return null
    const migrated = parseStudentSchedule(JSON.parse(legacyRaw))
    if (migrated) {
      saveStudentSchedule(storage, migrated)
      storage.removeItem(LEGACY_STUDENT_SCHEDULE_KEY)
    }
    return migrated
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
    storage.removeItem(LEGACY_STUDENT_SCHEDULE_KEY)
  } catch {
    /* ignore */
  }
}
