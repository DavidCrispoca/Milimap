/**
 * Content store.
 *
 * MVP PERSISTENCE: localStorage via Zustand `persist`. Every mutation checks the
 * caller's role with `can()` before touching state, and validates input with the
 * Zod schemas, so the rules hold no matter which screen calls the action.
 *
 * WHY NOT SUPABASE YET: the only Supabase project available belongs to another
 * product (marketinghub). Creating tables there is not a decision to make
 * unilaterally. The store is shaped like a repository so that a backend can
 * replace these actions without touching the screens.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SpaceId } from '@/domain/types'
import { can, type Action } from './permissions'
import { announcementInputSchema, eventInputSchema } from './validation'
import type { Announcement, CampusEvent, Role, ScheduleClass, SpaceEdit, Term } from './types'

/** Stable id generator; crypto.randomUUID is missing in some older browsers. */
function newId(prefix: string): string {
  const globalCrypto = globalThis.crypto as Crypto | undefined
  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return `${prefix}-${globalCrypto.randomUUID().slice(0, 8)}`
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

/** Local datetime string `days` from today at `hour:minute`, in datetime-local format. */
function atDayOffset(days: number, hour: number, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

/** Starting content so the app is not empty on first run. */
function seedEvents(): CampusEvent[] {
  const created = new Date().toISOString()
  return [
    {
      id: 'ev-seed-ceremonia',
      title: 'Ceremonia de graduación 2026-II',
      description:
        'Acto de graduación de los programas de pregrado y posgrado. Ingreso por la entrada principal con carné institucional.',
      startsAt: atDayOffset(14, 8),
      endsAt: atDayOffset(14, 13),
      spaceId: 'REC',
      category: 'ceremony',
      priority: 'high',
      published: true,
      createdAt: created,
    },
    {
      id: 'ev-seed-feria',
      title: 'Feria de semilleros de investigación',
      description:
        'Muestra de proyectos de los semilleros de todas las facultades. Abierta a toda la comunidad neogranadina.',
      startsAt: atDayOffset(5, 9),
      endsAt: atDayOffset(5, 17),
      spaceId: 'BIB',
      category: 'academic',
      priority: 'normal',
      published: true,
      createdAt: created,
    },
    {
      id: 'ev-seed-deporte',
      title: 'Torneo interfacultades',
      description: 'Fútbol y baloncesto. Inscripciones en Bienestar Universitario.',
      startsAt: atDayOffset(21, 14),
      endsAt: atDayOffset(21, 18),
      spaceId: 'CAFE',
      category: 'sports',
      priority: 'low',
      published: true,
      createdAt: created,
    },
  ]
}

function seedAnnouncements(): Announcement[] {
  return [
    {
      id: 'an-seed-mantenimiento',
      message: 'Mantenimiento del ascensor del Edificio Demo entre las 7:00 y las 9:00.',
      kind: 'warning',
      startsAt: atDayOffset(-1, 6),
      endsAt: atDayOffset(2, 23),
      published: true,
    },
  ]
}

export const DEFAULT_TERM: Term = {
  id: '2026-2',
  label: '2026-2',
  startsOn: '2026-08-03',
  endsOn: '2026-12-12',
  published: true,
}

export type EventDraft = Omit<CampusEvent, 'id' | 'createdAt'>
export type AnnouncementDraft = Omit<Announcement, 'id'>

export interface ContentState {
  role: Role | null
  events: CampusEvent[]
  announcements: Announcement[]
  classes: ScheduleClass[]
  terms: Term[]
  spaceEdits: Record<SpaceId, SpaceEdit>

  setRole: (role: Role | null) => void

  /** Returns the created event, or null when the role or the data is refused. */
  addEvent: (input: EventDraft) => CampusEvent | null
  updateEvent: (id: string, patch: Partial<EventDraft>) => boolean
  removeEvent: (id: string) => boolean
  toggleEventPublished: (id: string) => boolean

  addAnnouncement: (input: AnnouncementDraft) => Announcement | null
  updateAnnouncement: (id: string, patch: Partial<AnnouncementDraft>) => boolean
  removeAnnouncement: (id: string) => boolean
  toggleAnnouncementPublished: (id: string) => boolean

  replaceClasses: (termId: string, classes: ScheduleClass[]) => boolean

  setSpaceEdit: (spaceId: SpaceId, patch: SpaceEdit) => boolean
  clearSpaceEdit: (spaceId: SpaceId) => boolean

  resetContent: () => boolean
}

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => {
      const allowed = (action: Action): boolean => can(get().role, action)

      return {
        role: null,
        events: seedEvents(),
        announcements: seedAnnouncements(),
        classes: [],
        terms: [DEFAULT_TERM],
        spaceEdits: {},

        setRole: (role) => set({ role }),

        addEvent: (input) => {
          if (!allowed('edit_event')) return null
          // An editor can draft, not publish: the flag is forced off here.
          const candidate = { ...input, published: allowed('publish_event') && input.published }
          const parsed = eventInputSchema.safeParse(candidate)
          if (!parsed.success) return null
          const created: CampusEvent = {
            ...parsed.data,
            id: newId('ev'),
            createdAt: new Date().toISOString(),
          }
          set({ events: [created, ...get().events] })
          return created
        },

        updateEvent: (id, patch) => {
          if (!allowed('edit_event')) return false
          const current = get().events.find((item) => item.id === id)
          if (!current) return false
          const merged = { ...current, ...patch }
          if (patch.published === true && !allowed('publish_event')) merged.published = false
          const { id: _id, createdAt: _createdAt, ...draft } = merged
          const parsed = eventInputSchema.safeParse(draft)
          if (!parsed.success) return false
          set({
            events: get().events.map((item) =>
              item.id === id ? { ...item, ...parsed.data } : item,
            ),
          })
          return true
        },

        removeEvent: (id) => {
          if (!allowed('edit_event')) return false
          set({ events: get().events.filter((item) => item.id !== id) })
          return true
        },

        toggleEventPublished: (id) => {
          if (!allowed('publish_event')) return false
          set({
            events: get().events.map((item) =>
              item.id === id ? { ...item, published: !item.published } : item,
            ),
          })
          return true
        },

        addAnnouncement: (input) => {
          if (!allowed('edit_announcement')) return null
          const candidate = {
            ...input,
            published: allowed('publish_announcement') && input.published,
          }
          const parsed = announcementInputSchema.safeParse(candidate)
          if (!parsed.success) return null
          const created: Announcement = { ...parsed.data, id: newId('an') }
          set({ announcements: [created, ...get().announcements] })
          return created
        },

        updateAnnouncement: (id, patch) => {
          if (!allowed('edit_announcement')) return false
          const current = get().announcements.find((item) => item.id === id)
          if (!current) return false
          const merged = { ...current, ...patch }
          if (patch.published === true && !allowed('publish_announcement')) {
            merged.published = false
          }
          const { id: _id, ...draft } = merged
          const parsed = announcementInputSchema.safeParse(draft)
          if (!parsed.success) return false
          set({
            announcements: get().announcements.map((item) =>
              item.id === id ? { ...item, ...parsed.data } : item,
            ),
          })
          return true
        },

        removeAnnouncement: (id) => {
          if (!allowed('edit_announcement')) return false
          set({ announcements: get().announcements.filter((item) => item.id !== id) })
          return true
        },

        toggleAnnouncementPublished: (id) => {
          if (!allowed('publish_announcement')) return false
          set({
            announcements: get().announcements.map((item) =>
              item.id === id ? { ...item, published: !item.published } : item,
            ),
          })
          return true
        },

        replaceClasses: (termId, classes) => {
          if (!allowed('import_schedule')) return false
          set({
            classes: [...get().classes.filter((item) => item.termId !== termId), ...classes],
          })
          return true
        },

        setSpaceEdit: (spaceId, patch) => {
          if (!allowed('edit_space')) return false
          set({
            spaceEdits: {
              ...get().spaceEdits,
              [spaceId]: { ...get().spaceEdits[spaceId], ...patch },
            },
          })
          return true
        },

        clearSpaceEdit: (spaceId) => {
          if (!allowed('edit_space')) return false
          const next = { ...get().spaceEdits }
          delete next[spaceId]
          set({ spaceEdits: next })
          return true
        },

        resetContent: () => {
          if (!allowed('reset_content')) return false
          set({
            events: seedEvents(),
            announcements: seedAnnouncements(),
            classes: [],
            spaceEdits: {},
          })
          return true
        },
      }
    },
    {
      name: 'milimap.content.v1',
      // The role is session state. It must not survive a reload, or a closed
      // browser would keep an administrator's rights.
      partialize: (state) => ({
        events: state.events,
        announcements: state.announcements,
        classes: state.classes,
        terms: state.terms,
        spaceEdits: state.spaceEdits,
      }),
    },
  ),
)
