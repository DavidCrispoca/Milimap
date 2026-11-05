import { beforeEach, describe, expect, it } from 'vitest'
import { useContentStore } from './store'
import type { EventDraft } from './store'

const draft = (patch: Partial<EventDraft> = {}): EventDraft => ({
  title: 'Evento de prueba',
  description: 'Descripción',
  startsAt: '2026-12-01T10:00',
  endsAt: '2026-12-01T12:00',
  spaceId: 'BIB',
  category: 'academic',
  priority: 'normal',
  published: true,
  ...patch,
})

const state = () => useContentStore.getState()

describe('content store permissions', () => {
  beforeEach(() => {
    useContentStore.setState({
      role: null,
      events: [],
      announcements: [],
      classes: [],
      spaceEdits: {},
    })
  })

  it('refuses every write when no role is set', () => {
    expect(state().addEvent(draft())).toBeNull()
    expect(state().events).toHaveLength(0)
  })

  it('lets a viewer read but not write', () => {
    state().setRole('viewer')
    expect(state().addEvent(draft())).toBeNull()
    expect(state().setSpaceEdit('BIB', { name: 'X' })).toBe(false)
    expect(state().replaceClasses('2026-2', [])).toBe(false)
  })

  it('forces an editor draft to unpublished', () => {
    state().setRole('editor')
    const created = state().addEvent(draft({ published: true }))
    expect(created).not.toBeNull()
    expect(created?.published).toBe(false)
  })

  it('refuses an editor toggling publication', () => {
    state().setRole('admin')
    const created = state().addEvent(draft({ published: false }))!
    state().setRole('editor')
    expect(state().toggleEventPublished(created.id)).toBe(false)
    expect(state().events.find((item) => item.id === created.id)?.published).toBe(false)
  })

  it('lets an admin publish and the change is stored', () => {
    state().setRole('admin')
    const created = state().addEvent(draft({ published: false }))!
    expect(state().toggleEventPublished(created.id)).toBe(true)
    expect(state().events.find((item) => item.id === created.id)?.published).toBe(true)
  })

  it('strips publication when an editor updates an event to published', () => {
    state().setRole('admin')
    const created = state().addEvent(draft({ published: false }))!
    state().setRole('editor')
    state().updateEvent(created.id, { published: true })
    expect(state().events.find((item) => item.id === created.id)?.published).toBe(false)
  })

  it('refuses an invalid event even for an admin', () => {
    state().setRole('admin')
    expect(state().addEvent(draft({ title: 'x' }))).toBeNull()
    expect(state().addEvent(draft({ endsAt: '2026-12-01T09:00' }))).toBeNull()
    expect(state().events).toHaveLength(0)
  })

  it('lets an editor edit a space but not reset all content', () => {
    state().setRole('editor')
    expect(state().setSpaceEdit('BIB', { name: 'Biblioteca central' })).toBe(true)
    expect(state().spaceEdits.BIB?.name).toBe('Biblioteca central')
    expect(state().resetContent()).toBe(false)
  })

  it('never persists the role across a reload', () => {
    state().setRole('admin')
    const persisted = JSON.parse(localStorage.getItem('milimap.content.v1') ?? '{}')
    expect(persisted.state?.role).toBeUndefined()
  })
})
