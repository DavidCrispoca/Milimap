import { describe, expect, it } from 'vitest'
import {
  averagePoint,
  boundsOf,
  closestPointOnSegment,
  distance,
  polygonArea,
  polylineLength,
  turnAngle,
} from './geometry'
import type { LocalPoint } from './types'

const p = (x: number, y: number): LocalPoint => ({ x, y })

describe('distance', () => {
  it('measures a 3-4-5 triangle as 5 meters', () => {
    expect(distance(p(0, 0), p(3, 4))).toBe(5)
  })

  it('is zero for identical points', () => {
    expect(distance(p(7, 7), p(7, 7))).toBe(0)
  })
})

describe('polylineLength', () => {
  it('sums each leg', () => {
    expect(polylineLength([p(0, 0), p(3, 4), p(3, 14)])).toBe(15)
  })

  it('is zero for a single point', () => {
    expect(polylineLength([p(2, 2)])).toBe(0)
  })

  it('is zero for an empty list', () => {
    expect(polylineLength([])).toBe(0)
  })
})

describe('polygonArea', () => {
  it('measures a 2x3 rectangle as 6 square meters', () => {
    expect(polygonArea([p(0, 0), p(2, 0), p(2, 3), p(0, 3)])).toBe(6)
  })

  it('is orientation independent', () => {
    const ccw = [p(0, 0), p(2, 0), p(2, 3), p(0, 3)]
    const cw = [...ccw].reverse()
    expect(polygonArea(cw)).toBe(polygonArea(ccw))
  })
})

describe('averagePoint', () => {
  it('returns the center of a square', () => {
    expect(averagePoint([p(0, 0), p(2, 0), p(2, 2), p(0, 2)])).toEqual({ x: 1, y: 1 })
  })

  it('falls back to the origin for an empty ring', () => {
    expect(averagePoint([])).toEqual({ x: 0, y: 0 })
  })
})

describe('boundsOf', () => {
  it('wraps the ring in an axis-aligned box', () => {
    expect(boundsOf([p(1, 2), p(5, 0), p(3, 9)])).toEqual([1, 0, 5, 9])
  })
})

describe('turnAngle', () => {
  it('reports no turn when continuing straight', () => {
    expect(turnAngle(p(0, 0), p(10, 0), p(20, 0))).toBeCloseTo(0, 5)
  })

  it('reports a right turn as positive', () => {
    // Heading east, then heading south (+y down convention -> clockwise).
    expect(turnAngle(p(0, 0), p(10, 0), p(10, 10))).toBeCloseTo(90, 5)
  })

  it('reports a left turn as negative', () => {
    expect(turnAngle(p(0, 0), p(10, 0), p(10, -10))).toBeCloseTo(-90, 5)
  })

  it('reports a reversal near 180', () => {
    expect(Math.abs(turnAngle(p(0, 0), p(10, 0), p(0, 0)))).toBeCloseTo(180, 5)
  })
})

describe('closestPointOnSegment', () => {
  it('projects a perpendicular point onto the segment', () => {
    expect(closestPointOnSegment(p(5, 5), p(0, 0), p(10, 0))).toEqual({ x: 5, y: 0 })
  })

  it('clamps beyond the start endpoint', () => {
    expect(closestPointOnSegment(p(-5, 0), p(0, 0), p(10, 0))).toEqual({ x: 0, y: 0 })
  })

  it('clamps beyond the end endpoint', () => {
    expect(closestPointOnSegment(p(15, 0), p(0, 0), p(10, 0))).toEqual({ x: 10, y: 0 })
  })

  it('returns the point itself for a degenerate segment', () => {
    expect(closestPointOnSegment(p(4, 9), p(1, 1), p(1, 1))).toEqual({ x: 1, y: 1 })
  })
})
