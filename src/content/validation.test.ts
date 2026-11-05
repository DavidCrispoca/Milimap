import { describe, expect, it } from 'vitest'
import { can } from './permissions'
import { announcementInputSchema, eventInputSchema, issuesToMap } from './validation'
import { mergedCatalog } from './catalog'
import { demoCatalog } from '@/data'

describe('can', () => {
  it('gives an admin every action', () => {
    expect(can('admin', 'publish_event')).toBe(true)
    expect(can('admin', 'reset_content')).toBe(true)
  })

  it('lets an editor draft and maintain but not publish', () => {
    expect(can('editor', 'edit_event')).toBe(true)
    expect(can('editor', 'edit_space')).toBe(true)
    expect(can('editor', 'import_schedule')).toBe(true)
    expect(can('editor', 'publish_event')).toBe(false)
    expect(can('editor', 'publish_announcement')).toBe(false)
    expect(can('editor', 'reset_content')).toBe(false)
  })

  it('gives a viewer nothing', () => {
    expect(can('viewer', 'edit_event')).toBe(false)
  })

  it('gives nothing without a role', () => {
    expect(can(null, 'edit_event')).toBe(false)
  })
})

const validEvent = {
  title: 'Feria de semilleros',
  description: '',
  startsAt: '2026-12-01T10:00',
  endsAt: '2026-12-01T12:00',
  spaceId: 'BIB',
  category: 'academic',
  priority: 'normal',
  published: false,
}

describe('eventInputSchema', () => {
  it('accepts a valid event', () => {
    expect(eventInputSchema.safeParse(validEvent).success).toBe(true)
  })

  it('rejects a title shorter than 3 characters', () => {
    expect(eventInputSchema.safeParse({ ...validEvent, title: 'ab' }).success).toBe(false)
  })

  it('rejects an end before the start', () => {
    const result = eventInputSchema.safeParse({ ...validEvent, endsAt: '2026-12-01T09:00' })
    expect(result.success).toBe(false)
    if (!result.success) expect(issuesToMap(result.error.issues).endsAt).toMatch(/posterior/)
  })

  it('rejects a malformed date', () => {
    expect(eventInputSchema.safeParse({ ...validEvent, startsAt: '01/12/2026' }).success).toBe(
      false,
    )
  })

  it('accepts an event with no place', () => {
    expect(eventInputSchema.safeParse({ ...validEvent, spaceId: null }).success).toBe(true)
  })
})

describe('announcementInputSchema', () => {
  const validAnnouncement = {
    message: 'Mantenimiento del ascensor',
    kind: 'warning',
    startsAt: '2026-12-01T06:00',
    endsAt: '2026-12-02T06:00',
    published: true,
  }

  it('accepts a valid announcement', () => {
    expect(announcementInputSchema.safeParse(validAnnouncement).success).toBe(true)
  })

  it('rejects a message that is too short', () => {
    expect(announcementInputSchema.safeParse({ ...validAnnouncement, message: 'ok' }).success).toBe(
      false,
    )
  })

  it('rejects an unknown kind', () => {
    expect(announcementInputSchema.safeParse({ ...validAnnouncement, kind: 'spam' }).success).toBe(
      false,
    )
  })
})

describe('mergedCatalog', () => {
  it('returns the base catalog untouched without edits', () => {
    expect(mergedCatalog(demoCatalog, {})).toEqual(demoCatalog)
  })

  it('applies a rename and an alias list over the base entry', () => {
    const merged = mergedCatalog(demoCatalog, {
      BIB: { name: 'Biblioteca central', aliases: ['Central'] },
    })
    const bib = merged.find((entry) => entry.id === 'BIB')
    expect(bib?.name).toBe('Biblioteca central')
    expect(bib?.aliases).toEqual(['Central'])
    expect(merged.find((entry) => entry.id === 'A101')?.name).toBe('Aula 101')
  })

  it('can deactivate a room without touching its geometry', () => {
    const merged = mergedCatalog(demoCatalog, { CAFE: { active: false } })
    expect(merged.find((entry) => entry.id === 'CAFE')?.active).toBe(false)
  })
})
