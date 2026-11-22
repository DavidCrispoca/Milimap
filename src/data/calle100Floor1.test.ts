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

  it('passes floor validation for all 5 floors with 0 errors', () => {
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
    expect(calle100Campus.floors.length).toBe(5)
    expect(calle100Catalog.length).toBe(216)
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

  it('keeps the library corridor connected to the Bloque E corridor next to the Decanatura', () => {
    const p1 = calle100Campus.floors.find((f) => f.level === 1)!
    const biblioteca = p1.spaces.find((s) => s.id === 'BIBLIOTECA-CENTRAL')!
    const aulaE = p1.spaces.find((s) => s.id === 'AULA-E101')!
    const bano = p1.spaces.find((s) => s.id === 'BANO-E-OESTE')!
    const asso = p1.spaces.find((s) => s.id === 'DIRECCION-ASSO')!

    expect(p1.walkways.some((w) => w.id === 'w-conn-wingd-e')).toBe(true)

    // El baño comparte el borde y=62 con la Decanatura de Ingeniería y no invade
    // el conector (x 14–18), que queda libre para el paso de personas.
    expect(bano.polygon.some((p) => p.y === 62)).toBe(true)
    expect(Math.max(...bano.polygon.map((p) => p.x))).toBeLessThanOrEqual(14)
    expect(Math.min(...asso.polygon.map((p) => p.x))).toBeGreaterThanOrEqual(18)
    for (const space of p1.spaces) {
      const minX = Math.min(...space.polygon.map((p) => p.x))
      const maxX = Math.max(...space.polygon.map((p) => p.x))
      const minY = Math.min(...space.polygon.map((p) => p.y))
      const maxY = Math.max(...space.polygon.map((p) => p.y))
      expect(minX < 18 && maxX > 14 && minY < 70 && maxY > 62).toBe(false)
    }

    const route = computeRoute(index, {
      originNodeId: biblioteca.anchorNodeId,
      destinationNodeId: aulaE.anchorNodeId,
    })
    expect(route.ok).toBe(true)
    if (route.ok) {
      expect(route.route.nodeIds).toContain('c100-p1.conn-wingd-e')
      expect(route.route.levelsVisited).toEqual([1])
    }
  })

  it('places the external east facilities to the right of the main building', () => {
    const p1 = calle100Campus.floors.find((f) => f.level === 1)!
    const eastIds = [
      'RESTAURANTE-MUY',
      'PLAZOLETA-COMIDA',
      'BLOQUE-A',
      'PARQUEADERO-PPAL',
      'CAFE-LEGENDA',
      'EDITORIAL-NEOGRANADINA',
      'CARPA-BURGER',
      'CARPA-DELIRIO',
      'CARPA-TACOS',
      'CARPA-NATIVOS',
    ]
    const eastSpaces = p1.spaces.filter((space) => eastIds.includes(space.id))
    expect(eastSpaces).toHaveLength(eastIds.length)

    const mainSpaces = p1.spaces.filter((space) => {
      const minY = Math.min(...space.polygon.map((p) => p.y))
      const maxY = Math.max(...space.polygon.map((p) => p.y))
      return !eastIds.includes(space.id) && minY >= 0 && maxY <= 92
    })
    const mainMaxX = Math.max(...mainSpaces.flatMap((space) => space.polygon.map((p) => p.x)))

    for (const space of eastSpaces) {
      const minX = Math.min(...space.polygon.map((p) => p.x))
      expect(minX, space.name).toBeGreaterThan(mainMaxX)
    }

    const cafe = eastSpaces.find((space) => space.id === 'CAFE-LEGENDA')!
    const parking = eastSpaces.find((space) => space.id === 'PARQUEADERO-PPAL')!
    const editorial = eastSpaces.find((space) => space.id === 'EDITORIAL-NEOGRANADINA')!
    expect(Math.max(...cafe.polygon.map((p) => p.x))).toBeLessThanOrEqual(
      Math.min(...parking.polygon.map((p) => p.x)),
    )
    expect(Math.min(...editorial.polygon.map((p) => p.y))).toBeGreaterThanOrEqual(
      Math.max(...parking.polygon.map((p) => p.y)),
    )
    expect(p1.bounds[2]).toBeGreaterThanOrEqual(
      Math.max(...eastSpaces.flatMap((space) => space.polygon.map((p) => p.x))),
    )
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

  it('routes within Piso 1: Entrada E to Aula Máxima (zona exterior)', () => {
    const p1 = calle100Campus.floors.find((f) => f.level === 1)!
    const space = p1.spaces.find((s) => s.id === 'AULA-MAXIMA-EXT')!
    const route = computeRoute(index, {
      originNodeId: 'c100-p1.ent-e',
      destinationNodeId: space.anchorNodeId,
    })
    expect(route.ok).toBe(true)
    if (route.ok) {
      expect(route.route.levelsVisited).toEqual([1])
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
