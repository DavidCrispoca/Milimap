import { describe, expect, it } from 'vitest'
import { demoCampus } from '@/data'
import { buildGraphIndex, computeRoute, findPath, isReachable } from './routing'
import type { Campus } from './routing'
import type { Floor } from './types'

const index = buildGraphIndex(demoCampus)

describe('findPath', () => {
  it('routes between two points on the same floor', () => {
    const path = findPath(index, 'p1.ent', 'p1.door-A104')
    expect(path).not.toBeNull()
    expect(path?.nodeIds[0]).toBe('p1.ent')
    expect(path?.nodeIds.at(-1)).toBe('p1.door-A104')
    expect(path?.cost).toBeGreaterThan(30)
  })

  it('returns a single-node path when origin equals destination', () => {
    const path = findPath(index, 'p1.ent', 'p1.ent')
    expect(path).toEqual({ nodeIds: ['p1.ent'], edges: [], cost: 0 })
  })

  it('crosses floors using a vertical transition', () => {
    const path = findPath(index, 'p1.ent', 'p2.door-A201')
    expect(path).not.toBeNull()
    const kinds = path?.edges.map((edge) => edge.kind) ?? []
    expect(kinds).toContain('stair')
    expect(path?.nodeIds).toContain('p2.door-A201')
  })

  it('returns null for an unknown origin', () => {
    expect(findPath(index, 'does.not.exist', 'p1.door-A101')).toBeNull()
  })

  it('returns null for an unknown destination', () => {
    expect(findPath(index, 'p1.ent', 'does.not.exist')).toBeNull()
  })

  it('avoids stairs when asked, using the elevator instead', () => {
    const path = findPath(index, 'p1.ent', 'p2.door-A201', { avoidStairs: true })
    expect(path).not.toBeNull()
    const kinds = path?.edges.map((edge) => edge.kind) ?? []
    expect(kinds).toContain('elevator')
    expect(kinds).not.toContain('stair')
  })

  it('returns null when the only vertical link is excluded', () => {
    // The demo has no ramp, so excluding both cores disconnects the upper floor.
    expect(
      findPath(index, 'p1.ent', 'p2.door-A201', { avoidStairs: true, avoidElevators: true }),
    ).toBeNull()
  })

  it('is symmetric: going back costs the same', () => {
    const forward = findPath(index, 'p1.ent', 'p2.door-A204')
    const backward = findPath(index, 'p2.door-A204', 'p1.ent')
    expect(forward?.cost).toBeCloseTo(backward?.cost ?? 0, 5)
  })
})

describe('computeRoute', () => {
  it('produces steps in Spanish and English', () => {
    const result = computeRoute(index, {
      originNodeId: 'p1.ent',
      destinationNodeId: 'p1.door-A104',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.route.steps.length).toBeGreaterThan(1)
    for (const step of result.route.steps) {
      expect(step.instruction.length).toBeGreaterThan(0)
      expect(step.instructionEn.length).toBeGreaterThan(0)
    }
  })

  it('starts with a start step and ends at the named destination', () => {
    const result = computeRoute(
      index,
      { originNodeId: 'p1.ent', destinationNodeId: 'p1.door-A104' },
      { destinationName: 'Aula 104' },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const first = result.route.steps[0]
    const last = result.route.steps.at(-1)
    expect(first?.kind).toBe('start')
    expect(last?.kind).toBe('destination')
    expect(last?.instruction).toContain('Aula 104')
  })

  it('reports floor changes and totals for a two-floor route', () => {
    const result = computeRoute(index, {
      originNodeId: 'p1.ent',
      destinationNodeId: 'p2.door-A201',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.route.levelsVisited).toEqual([1, 2])
    expect(result.route.hasStairs).toBe(true)
    expect(result.route.totalMeters).toBeGreaterThan(70)
    expect(result.route.estimatedSeconds).toBeGreaterThan(50)

    const transitionStep = result.route.steps.find((step) => step.kind === 'stairs')
    expect(transitionStep?.instruction).toMatch(/escaleras/i)
    expect(transitionStep?.distanceMeters).toBeCloseTo(4, 5)
  })

  it('marks the elevator route as accessible', () => {
    const result = computeRoute(index, {
      originNodeId: 'p1.ent',
      destinationNodeId: 'p2.door-A201',
      avoidStairs: true,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.route.hasElevators).toBe(true)
    expect(result.route.hasStairs).toBe(false)
  })

  it('handles origin equal to destination', () => {
    const result = computeRoute(
      index,
      { originNodeId: 'p1.ent', destinationNodeId: 'p1.ent' },
      { destinationName: 'Recepción' },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.route.totalMeters).toBe(0)
    expect(result.route.steps).toHaveLength(1)
    expect(result.route.steps[0]?.instruction).toContain('Recepción')
  })

  it('returns typed failures instead of throwing', () => {
    expect(computeRoute(index, { originNodeId: 'nope', destinationNodeId: 'p1.ent' })).toEqual({
      ok: false,
      code: 'ORIGIN_NOT_FOUND',
    })

    expect(computeRoute(index, { originNodeId: 'p1.ent', destinationNodeId: 'nope' })).toEqual({
      ok: false,
      code: 'DESTINATION_NOT_FOUND',
    })
  })

  it('reports GRAPH_EMPTY for a campus with no floors', () => {
    const empty: Campus = { building: demoCampus.building, floors: [] }
    const emptyIndex = buildGraphIndex(empty)
    expect(computeRoute(emptyIndex, { originNodeId: 'a', destinationNodeId: 'b' })).toEqual({
      ok: false,
      code: 'GRAPH_EMPTY',
    })
  })
})

describe('isReachable', () => {
  it('confirms every demo space is reachable from the entrance', () => {
    for (const floor of demoCampus.floors) {
      for (const space of floor.spaces) {
        expect(isReachable(index, 'p1.ent', space.anchorNodeId)).toBe(true)
      }
    }
  })

  it('detects a disconnected node', () => {
    const isolated: Floor = {
      ...demoCampus.floors[0]!,
      nodes: [
        ...demoCampus.floors[0]!.nodes,
        { id: 'p1.island', point: { x: 0, y: 0 }, kind: 'junction' },
      ],
    }
    const campus: Campus = { building: demoCampus.building, floors: [isolated] }
    const isolatedIndex = buildGraphIndex(campus)
    expect(isReachable(isolatedIndex, 'p1.ent', 'p1.island')).toBe(false)
  })
})
