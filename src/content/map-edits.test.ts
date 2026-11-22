import { beforeEach, describe, expect, it } from 'vitest'
import { demoCampus } from '@/data'
import {
  applyFloorGeometry,
  applyMapEdits,
  cloneGeometry,
  editedFloorCount,
  geometryOf,
  geometryStats,
  type FloorGeometry,
} from './map-edits'
import { useContentStore } from './store'

const floor = demoCampus.floors[0]!
const original = geometryOf(floor)

describe('map edit overlay', () => {
  it('clones deeply so the editor cannot mutate the digitized plan', () => {
    const copy = cloneGeometry(original)
    copy.spaces[0]!.polygon[0]!.x = 999
    copy.nodes[0]!.point.y = 999
    expect(original.spaces[0]!.polygon[0]!.x).not.toBe(999)
    expect(original.nodes[0]!.point.y).not.toBe(999)
  })

  it('returns the same campus when there are no edits', () => {
    expect(applyMapEdits(demoCampus, {})).toBe(demoCampus)
    expect(editedFloorCount({})).toBe(0)
  })

  it('replaces geometry but keeps bounds, level and transitions', () => {
    const geometry = cloneGeometry(original)
    geometry.spaces = []
    const edited = applyFloorGeometry(floor, geometry)
    expect(edited.spaces).toHaveLength(0)
    expect(edited.bounds).toEqual(floor.bounds)
    expect(edited.level).toBe(floor.level)
    expect(edited.transitions).toBe(floor.transitions)
  })

  it('applies only the floors present in the overlay', () => {
    const geometry = cloneGeometry(original)
    geometry.nodes = []
    const campus = applyMapEdits(demoCampus, { [floor.id]: geometry })
    expect(campus.floors.find((item) => item.id === floor.id)?.nodes).toHaveLength(0)
    const untouched = demoCampus.floors.find((item) => item.id !== floor.id)!
    expect(campus.floors.find((item) => item.id === untouched.id)?.nodes).toEqual(untouched.nodes)
    expect(editedFloorCount({ [floor.id]: geometry })).toBe(1)
  })

  it('reports entity counts for the editor header', () => {
    const stats = geometryStats(original)
    expect(stats.spaces).toBe(original.spaces.length)
    expect(stats.nodes).toBe(original.nodes.length)
    expect(stats.edges).toBe(original.edges.length)
    expect(stats.walkways).toBe(original.walkways.length)
  })
})

describe('map edits in the content store', () => {
  beforeEach(() => {
    useContentStore.setState({
      role: null,
      spaceEdits: {},
      mapEdits: {},
    })
  })

  const state = () => useContentStore.getState()
  const geometry = (): FloorGeometry => cloneGeometry(original)

  it('refuses geometry writes without an editing role', () => {
    expect(state().saveFloorGeometry(floor.id, geometry())).toBe(false)
    state().setRole('viewer')
    expect(state().saveFloorGeometry(floor.id, geometry())).toBe(false)
    expect(state().mapEdits[floor.id]).toBeUndefined()
  })

  it('lets an editor save and reset one floor without touching the others', () => {
    state().setRole('editor')
    const first = geometry()
    first.spaces = []
    expect(state().saveFloorGeometry(floor.id, first)).toBe(true)
    expect(state().mapEdits[floor.id]).toBe(first)

    const second = geometry()
    second.nodes = []
    expect(state().saveFloorGeometry('another-floor', second)).toBe(true)
    expect(state().resetFloorGeometry(floor.id)).toBe(true)
    expect(state().mapEdits[floor.id]).toBeUndefined()
    expect(state().mapEdits['another-floor']).toBe(second)
  })

  it('clears geometry overlays on a full reset and persists them', () => {
    state().setRole('admin')
    state().saveFloorGeometry(floor.id, geometry())
    const persisted = JSON.parse(localStorage.getItem('milimap.content.v1') ?? '{}')
    expect(persisted.state?.mapEdits?.[floor.id]).toBeDefined()
    expect(state().resetContent()).toBe(true)
    expect(state().mapEdits).toEqual({})
  })
})
