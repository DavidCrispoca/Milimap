/**
 * Geometry helpers for the SVG floor plan.
 *
 * Kept out of the component file so that file exports only components, which is
 * what React Fast Refresh needs to work during development.
 */

import type { LocalPoint, Route } from '@/domain/types'

/** Collect the route polyline for one floor, de-duplicating shared joints. */
export function routePolylineForLevel(
  route: Route | null | undefined,
  level: number,
): LocalPoint[] {
  if (!route) return []

  const points: LocalPoint[] = []
  for (const step of route.steps) {
    if (step.level !== level) continue
    for (const point of step.points) {
      const previous = points[points.length - 1]
      if (previous && previous.x === point.x && previous.y === point.y) continue
      points.push(point)
    }
  }
  return points
}

/** Vertex average: good enough as a label anchor for rectangles. */
export function spaceCentre(polygon: readonly LocalPoint[]): LocalPoint {
  if (polygon.length === 0) return { x: 0, y: 0 }
  let x = 0
  let y = 0
  for (const point of polygon) {
    x += point.x
    y += point.y
  }
  return { x: x / polygon.length, y: y / polygon.length }
}

/** Trim long names so they fit inside a room polygon. */
export function shortLabel(name: string): string {
  const compact = name
    .replace('Laboratorio de ', 'Lab. ')
    .replace('Sala de estudio', 'Sala estudio')
  return compact.length > 14 ? `${compact.slice(0, 13)}…` : compact
}
