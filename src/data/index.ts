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
import { CALLE100_BUILDING_ID, CALLE100_FLOOR1_ID, calle100Floor1 } from './calle100Floor1'
import { calle100BuildingFull, calle100CatalogFull, calle100FloorsFull } from './calle100Floors'

export const calle100Building = calle100BuildingFull
export const calle100Catalog = calle100CatalogFull
export const calle100Floors = calle100FloorsFull

export {
  demoBuilding,
  demoCatalog,
  demoFloors,
  calle100Floor1,
  CALLE100_BUILDING_ID,
  CALLE100_FLOOR1_ID,
}

/** Calle 100 real campus (Complete: Sótano, Piso 1, 2, 3, 4, 5). */
export const calle100Campus: Campus = {
  building: calle100BuildingFull,
  floors: calle100FloorsFull,
}

/** DEMO campus. Kept for unit tests and multi-level simulation. */
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
