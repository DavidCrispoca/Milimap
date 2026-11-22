/**
 * Map geometry edits (Phase 3).
 *
 * The digitized plans live as TypeScript modules under `src/data`. Editing them
 * in the browser must not rewrite those files, so the admin editor keeps an
 * overlay per floor: spaces, walkways and the routing graph. Applying the
 * overlay is a pure function, which keeps the public map, the router and the
 * validator reading exactly the same data.
 *
 * PERSISTENCE: the overlay is stored in localStorage by the content store, like
 * every other admin change. Exporting a floor from the editor produces the JSON
 * that eventually replaces the demo module.
 */

import type { Campus } from '@/domain/routing'
import type { Floor, FloorId, GraphEdge, GraphNode, Space, Walkway } from '@/domain/types'

/** The editable part of a floor. `bounds`, levels and transitions stay static. */
export interface FloorGeometry {
  spaces: Space[]
  walkways: Walkway[]
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/** Overlay keyed by floor id. A missing key means "use the digitized data". */
export type MapEdits = Partial<Record<FloorId, FloorGeometry>>

/** Snapshot of a floor's editable parts. */
export function geometryOf(floor: Floor): FloorGeometry {
  return {
    spaces: floor.spaces,
    walkways: floor.walkways,
    nodes: floor.nodes,
    edges: floor.edges,
  }
}

/**
 * Deep copy so the editor can mutate freely without touching module data.
 * `structuredClone` is not guaranteed in the browsers we target, and the shape
 * is small and fixed, so a manual copy is cheaper than a polyfill.
 */
export function cloneGeometry(geometry: FloorGeometry): FloorGeometry {
  return {
    spaces: geometry.spaces.map((space) => ({
      ...space,
      aliases: [...space.aliases],
      polygon: space.polygon.map((point) => ({ ...point })),
    })),
    walkways: geometry.walkways.map((walkway) => ({
      ...walkway,
      polygon: walkway.polygon.map((point) => ({ ...point })),
    })),
    nodes: geometry.nodes.map((node) => ({ ...node, point: { ...node.point } })),
    edges: geometry.edges.map((edge) => ({ ...edge })),
  }
}

/** Apply one floor's overlay. */
export function applyFloorGeometry(floor: Floor, geometry: FloorGeometry | undefined): Floor {
  if (!geometry) return floor
  return {
    ...floor,
    spaces: geometry.spaces,
    walkways: geometry.walkways,
    nodes: geometry.nodes,
    edges: geometry.edges,
  }
}

/**
 * Apply every overlay. Returns the campus unchanged when there is nothing to
 * apply, so callers can memoize on the overlay object alone.
 */
export function applyMapEdits(campus: Campus, edits: MapEdits): Campus {
  if (Object.keys(edits).length === 0) return campus
  return {
    ...campus,
    floors: campus.floors.map((floor) => applyFloorGeometry(floor, edits[floor.id])),
  }
}

/** Count of floors with a saved overlay. */
export function editedFloorCount(edits: MapEdits): number {
  return Object.keys(edits).length
}

/** Total entity count, used by the editor header. */
export function geometryStats(geometry: FloorGeometry): {
  spaces: number
  walkways: number
  nodes: number
  edges: number
} {
  return {
    spaces: geometry.spaces.length,
    walkways: geometry.walkways.length,
    nodes: geometry.nodes.length,
    edges: geometry.edges.length,
  }
}
