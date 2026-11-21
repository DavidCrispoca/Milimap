import { describe, expect, it } from 'vitest'
import {
  CALLE100_BUILDING_ID,
  CALLE100_FLOOR1_ID,
  calle100Building,
  calle100Campus,
  calle100Catalog,
  calle100Floor1,
} from './index'
import { buildGraphIndex, computeRoute, isReachable } from '@/domain/routing'
import { validateCampus, validateFloor } from '@/domain/validate'

describe('calle100 campus dataset', () => {
  const index = buildGraphIndex(calle100Campus)

  it('passes floor validation for all 6 floors with 0 errors', () => {
    for (const floor of calle100Campus.floors) {
      const issues = validateFloor(floor)
      const errors = issues.filter((i) => i.severity === 'error')
      expect(errors, `Floor ${floor.levelLabel} must have 0 errors`).toEqual([])
    }
  })

  it('passes whole campus validation with 0 errors', () => {
    const issues = validateCampus(calle100Campus)
    const errors = issues.filter((i) => i.severity === 'error')
    expect(errors).toEqual([])
  })

  it('has valid building metadata across all levels', () => {
    expect(calle100Building.id).toBe(CALLE100_BUILDING_ID)
    expect(calle100Floor1.id).toBe(CALLE100_FLOOR1_ID)
    expect(calle100Campus.floors.length).toBe(6)
    expect(calle100Catalog.length).toBe(195)
  })

  it('every space in the campus is reachable from Entrada D on Piso 1', () => {
    const entranceD = 'c100-p1.ent-d'
    for (const floor of calle100Campus.floors) {
      for (const space of floor.spaces) {
        const reachable = isReachable(index, entranceD, space.anchorNodeId)
        expect(
          reachable,
          `Space ${space.name} (${space.id}) on ${floor.levelLabel} must be reachable from Entrada D`,
        ).toBe(true)
      }
    }
  })

  it('routes within Piso 1: Entrada D to Aula E101 across Bloque E', () => {
    const p1 = calle100Campus.floors.find((f) => f.level === 1)!
    const space = p1.spaces.find((s) => s.id === 'AULA-E101')!
    const route = computeRoute(index, {
      originNodeId: 'c100-p1.ent-d',
      destinationNodeId: space.anchorNodeId,
    })
    expect(route.ok).toBe(true)
    if (route.ok) {
      expect(route.route.totalMeters).toBeGreaterThan(50)
      expect(route.route.levelsVisited).toEqual([1])
      expect(route.route.hasStairs).toBe(false)
    }
  })

  it('routes multi-level: Entrada D (P1) to Aula D202 (P2)', () => {
    const p2 = calle100Campus.floors.find((f) => f.level === 2)!
    const space = p2.spaces.find((s) => s.id === 'D202')!
    const route = computeRoute(index, {
      originNodeId: 'c100-p1.ent-d',
      destinationNodeId: space.anchorNodeId,
    })
    expect(route.ok).toBe(true)
    if (route.ok) {
      expect(route.route.levelsVisited).toEqual([1, 2])
      expect(route.route.hasStairs).toBe(true)
    }
  })

  it('routes multi-level: Entrada C (P1) to Aula C308 (P3)', () => {
    const p3 = calle100Campus.floors.find((f) => f.level === 3)!
    const space = p3.spaces.find((s) => s.id === 'C308')!
    const route = computeRoute(index, {
      originNodeId: 'c100-p1.ent-c',
      destinationNodeId: space.anchorNodeId,
    })
    expect(route.ok).toBe(true)
    if (route.ok) {
      expect(route.route.levelsVisited).toEqual([1, 2, 3])
      expect(route.route.hasStairs).toBe(true)
    }
  })

  it('routes multi-level: Entrada E (P1) to Aula E407 (P4)', () => {
    const p4 = calle100Campus.floors.find((f) => f.level === 4)!
    const space = p4.spaces.find((s) => s.id === 'E407')!
    const route = computeRoute(index, {
      originNodeId: 'c100-p1.ent-e',
      destinationNodeId: space.anchorNodeId,
    })
    expect(route.ok).toBe(true)
    if (route.ok) {
      expect(route.route.levelsVisited).toEqual([1, 2, 3, 4])
      expect(route.route.hasStairs).toBe(true)
    }
  })

  it('routes multi-level: Entrada E (P1) to Lab 3 Multimedia (P5)', () => {
    const p5 = calle100Campus.floors.find((f) => f.level === 5)!
    const space = p5.spaces.find((s) => s.id === 'LAB3-MULTI')!
    const route = computeRoute(index, {
      originNodeId: 'c100-p1.ent-e',
      destinationNodeId: space.anchorNodeId,
    })
    expect(route.ok).toBe(true)
    if (route.ok) {
      expect(route.route.levelsVisited).toEqual([1, 2, 3, 4, 5])
    }
  })

  it('routes multi-level to Sótano: Entrada E (P1) to Gimnasio (S1)', () => {
    const s1 = calle100Campus.floors.find((f) => f.level === -1)!
    const space = s1.spaces.find((s) => s.id === 'GIMNASIO-AULA-MAXIMA')!
    const route = computeRoute(index, {
      originNodeId: 'c100-p1.ent-e',
      destinationNodeId: space.anchorNodeId,
    })
    expect(route.ok).toBe(true)
    if (route.ok) {
      expect(route.route.levelsVisited).toEqual([-1, 1])
    }
  })

  it('supports accessible elevator routing across floors', () => {
    const p3 = calle100Campus.floors.find((f) => f.level === 3)!
    const space = p3.spaces.find((s) => s.id === 'C308')!
    const route = computeRoute(index, {
      originNodeId: 'c100-p1.ent-c',
      destinationNodeId: space.anchorNodeId,
      avoidStairs: true,
    })
    expect(route.ok).toBe(true)
    if (route.ok) {
      expect(route.route.hasStairs).toBe(false)
      expect(route.route.hasElevators).toBe(true)
    }
  })
})
