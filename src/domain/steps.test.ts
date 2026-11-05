import { describe, expect, it } from 'vitest'
import { splitIntoLegs } from './steps'
import type { LocalPoint } from './types'

const p = (x: number, y: number): LocalPoint => ({ x, y })

describe('splitIntoLegs — turn direction', () => {
  it('calls heading north then east a RIGHT turn', () => {
    // +y is north, +x is east: north -> east is clockwise, i.e. right.
    const legs = splitIntoLegs([p(0, 0), p(0, 10), p(10, 10)])
    expect(legs).toHaveLength(2)
    expect(legs[0]?.turn).toBeNull()
    expect(legs[1]?.turn?.es).toBe('Gire a la derecha')
  })

  it('calls heading north then west a LEFT turn', () => {
    const legs = splitIntoLegs([p(0, 0), p(0, 10), p(-10, 10)])
    expect(legs[1]?.turn?.es).toBe('Gire a la izquierda')
  })

  it('calls heading east then north a LEFT turn', () => {
    const legs = splitIntoLegs([p(0, 0), p(10, 0), p(10, 10)])
    expect(legs[1]?.turn?.es).toBe('Gire a la izquierda')
  })

  it('calls heading east then south a RIGHT turn', () => {
    const legs = splitIntoLegs([p(0, 0), p(10, 0), p(10, -10)])
    expect(legs[1]?.turn?.es).toBe('Gire a la derecha')
  })
})

describe('splitIntoLegs — collapsing', () => {
  it('collapses a collinear corridor into one leg', () => {
    // A corridor modelled with many nodes must not become many instructions.
    const points = [p(0, 0), p(4, 0), p(8, 0), p(12, 0), p(16, 0)]
    const legs = splitIntoLegs(points)
    expect(legs).toHaveLength(1)
    expect(legs[0]?.meters).toBeCloseTo(16, 5)
  })

  it('keeps a right-angle turn as two legs', () => {
    const legs = splitIntoLegs([p(0, 0), p(10, 0), p(10, 6)])
    expect(legs).toHaveLength(2)
    expect(legs[0]?.meters).toBeCloseTo(10, 5)
    expect(legs[1]?.meters).toBeCloseTo(6, 5)
  })

  it('produces a slight-turn phrase below 60 degrees', () => {
    // ~30 degrees off the previous heading.
    const legs = splitIntoLegs([p(0, 0), p(0, 10), p(5.77, 20)])
    expect(legs[1]?.turn?.es).toMatch(/ligeramente a la (derecha|izquierda)/)
  })

  it('produces a turn-around phrase past 135 degrees', () => {
    const legs = splitIntoLegs([p(0, 0), p(10, 0), p(0, 0.1)])
    expect(legs[1]?.turn?.es).toBe('Dé la vuelta')
  })

  it('returns nothing for a single point', () => {
    expect(splitIntoLegs([p(1, 1)])).toHaveLength(0)
  })

  it('returns nothing for an empty polyline', () => {
    expect(splitIntoLegs([])).toHaveLength(0)
  })
})
