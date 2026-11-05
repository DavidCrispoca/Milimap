/**
 * Content types: the things an administrator edits.
 *
 * Kept separate from `domain/types` on purpose. The domain model is the map
 * (geometry + graph) and changes rarely. Content is the stuff the university
 * updates every week: events, announcements, schedules, room metadata.
 *
 * MVP PERSISTENCE: everything here lives in the browser (localStorage). There is
 * no server yet. Each item therefore carries enough information to be validated
 * on its own, and ids are generated client-side.
 */

import type { SpaceId, SpaceKind } from '@/domain/types'

export type Role = 'admin' | 'editor' | 'viewer'

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export type EventCategory =
  'ceremony' | 'academic' | 'sports' | 'cultural' | 'administrative' | 'emergency'

export type EventPriority = 'low' | 'normal' | 'high'

export interface CampusEvent {
  id: string
  title: string
  description: string
  /** ISO 8601 local datetime, e.g. "2026-12-11T08:00". */
  startsAt: string
  endsAt: string
  /** Space the event happens in; used to build a route. */
  spaceId: SpaceId | null
  category: EventCategory
  priority: EventPriority
  published: boolean
  createdAt: string
}

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export type AnnouncementKind = 'info' | 'warning' | 'emergency'

export interface Announcement {
  id: string
  message: string
  kind: AnnouncementKind
  /** Validity window. Outside it the banner hides itself. */
  startsAt: string
  endsAt: string
  published: boolean
}

/* ------------------------------------------------------------------ */
/* Schedule                                                            */
/* ------------------------------------------------------------------ */

/**
 * A class session. `weekday` follows the human convention: 1 = Monday …
 * 6 = Saturday. (JavaScript's `getDay()` puts Sunday at 0, so callers must
 * convert; the CSV parser already does.)
 */
export interface ScheduleClass {
  id: string
  termId: string
  code: string
  subject: string
  teacher: string
  spaceId: SpaceId
  weekday: number
  /** "HH:MM" 24h. */
  startsAt: string
  endsAt: string
  group: string
}

/** A published academic term. Changing term must not destroy the previous one. */
export interface Term {
  id: string
  label: string
  startsOn: string
  endsOn: string
  published: boolean
}

/* ------------------------------------------------------------------ */
/* Space metadata edits                                                */
/* ------------------------------------------------------------------ */

/**
 * Administrators can rename a room or fix its type without touching geometry.
 * Geometry changes belong to the map editor (Phase 3).
 */
export interface SpaceEdit {
  name?: string
  aliases?: string[]
  kind?: SpaceKind
  capacity?: number
  active?: boolean
}

/* ------------------------------------------------------------------ */
/* Form validation helpers                                             */
/* ------------------------------------------------------------------ */

export interface ValidationProblem {
  field: string
  message: string
}

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  ceremony: 'Ceremonia',
  academic: 'Académico',
  sports: 'Deportivo',
  cultural: 'Cultural',
  administrative: 'Administrativo',
  emergency: 'Emergencia',
}

export const EVENT_PRIORITY_LABEL: Record<EventPriority, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
}

export const ANNOUNCEMENT_KIND_LABEL: Record<AnnouncementKind, string> = {
  info: 'Informativo',
  warning: 'Advertencia',
  emergency: 'Urgente',
}

export const WEEKDAY_LABEL = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]
