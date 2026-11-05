/**
 * Pure geometry helpers for floor-local meter coordinates.
 *
 * No dependencies, no framework, no I/O. Everything here is a total function
 * over numbers, which is what makes the routing engine testable without a DOM.
 */

import type { Bounds, LocalPoint } from './types'

/** Euclidean distance between two floor-local points, in meters. */
export function distance(a: LocalPoint, b: LocalPoint): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.hypot(dx, dy)
}

/** Total length of an open polyline, in meters. */
export function polylineLength(points: readonly LocalPoint[]): number {
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]
    const curr = points[i]
    if (!prev || !curr) continue
    total += distance(prev, curr)
  }
  return total
}

/** Signed area of a closed ring. Positive means counter-clockwise. */
export function signedArea(points: readonly LocalPoint[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i += 1) {
    const curr = points[i]
    const next = points[(i + 1) % points.length]
    if (!curr || !next) continue
    sum += curr.x * next.y - next.x * curr.y
  }
  return sum / 2
}

/** Absolute polygon area in square meters. */
export function polygonArea(points: readonly LocalPoint[]): number {
  return Math.abs(signedArea(points))
}

/** Arithmetic mean of the ring's vertices. Fine as a label anchor, not a true centroid. */
export function averagePoint(points: readonly LocalPoint[]): LocalPoint {
  if (points.length === 0) return { x: 0, y: 0 }
  let sx = 0
  let sy = 0
  for (const p of points) {
    sx += p.x
    sy += p.y
  }
  return { x: sx / points.length, y: sy / points.length }
}

/** Bounding box of a ring, as [minX, minY, maxX, maxY]. */
export function boundsOf(points: readonly LocalPoint[]): Bounds {
  if (points.length === 0) return [0, 0, 0, 0]
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return [minX, minY, maxX, maxY]
}

/**
 * Bearing change between two consecutive legs, in degrees, normalized to
 * (-180, 180]. Positive = turn right (clockwise on a standard x-right/y-up plane).
 *
 * Used by the instruction generator to decide between "go straight",
 * "turn slightly right", "turn right" and "turn around".
 */
export function turnAngle(a: LocalPoint, b: LocalPoint, c: LocalPoint): number {
  const v1x = b.x - a.x
  const v1y = b.y - a.y
  const v2x = c.x - b.x
  const v2y = c.y - b.y

  const angle1 = Math.atan2(v1y, v1x)
  const angle2 = Math.atan2(v2y, v2x)

  let delta = ((angle2 - angle1) * 180) / Math.PI
  // Normalize into (-180, 180]
  while (delta <= -180) delta += 360
  while (delta > 180) delta -= 360
  return delta
}

/** Point on the segment a-b closest to p. Used for snapping and wall checks. */
export function closestPointOnSegment(p: LocalPoint, a: LocalPoint, b: LocalPoint): LocalPoint {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const lengthSquared = abx * abx + aby * aby

  // Degenerate segment: a and b coincide.
  if (lengthSquared === 0) return { x: a.x, y: a.y }

  const t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSquared
  const clamped = Math.min(1, Math.max(0, t))
  return { x: a.x + clamped * abx, y: a.y + clamped * aby }
}
