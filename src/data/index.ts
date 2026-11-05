/**
 * Campus assembly and data accessors.
 *
 * Everything the app needs to read map data goes through this module. When the
 * real digitized data arrives, only this file changes: it will load JSON files
 * and validate them with Zod instead of importing the demo module.
 */

import type { Campus } from '@/domain/routing'
import type { CatalogEntry, Floor, GraphNode, NodeId, Space, SpaceId } from '@/domain/types'
import { demoBuilding, demoCatalog, demoFloors } from './demo'

export { demoBuilding, demoCatalog, demoFloors }

/** DEMO campus. Replaced by real data in Phase 7. */
export const demoCampus: Campus = {
  building: demoBuilding,
  floors: demoFloors,
}

/** Floors sorted for the level selector (basements first). */
export function sortedFloors(campus: Campus = demoCampus): Floor[] {
  return [...campus.floors].sort((a, b) => a.order - b.order)
}

/** Find a space by id across all floors. */
export function findSpace(spaceId: SpaceId, campus: Campus = demoCampus): Space | null {
  for (const floor of campus.floors) {
    const space = floor.spaces.find((candidate) => candidate.id === spaceId)
    if (space) return space
  }
  return null
}

/** Floor that owns a space. */
export function findSpaceFloor(spaceId: SpaceId, campus: Campus = demoCampus): Floor | null {
  return campus.floors.find((floor) => floor.spaces.some((space) => space.id === spaceId)) ?? null
}

/** Node plus the floor it belongs to. */
export function findNode(
  nodeId: NodeId,
  campus: Campus = demoCampus,
): { floor: Floor; node: GraphNode } | null {
  for (const floor of campus.floors) {
    const node = floor.nodes.find((candidate) => candidate.id === nodeId)
    if (node) return { floor, node }
  }
  return null
}

/** Catalog entry for a space id. */
export function findCatalogEntry(
  spaceId: SpaceId,
  catalog: readonly CatalogEntry[] = demoCatalog,
): CatalogEntry | null {
  return catalog.find((entry) => entry.id === spaceId) ?? null
}

/** Entrance nodes, used as default origins. */
export function entrances(campus: Campus = demoCampus): Array<{ floor: Floor; node: GraphNode }> {
  return campus.floors.flatMap((floor) =>
    floor.nodes.filter((node) => node.kind === 'entrance').map((node) => ({ floor, node })),
  )
}
