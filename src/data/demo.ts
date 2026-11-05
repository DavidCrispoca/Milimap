/**
 * Demo campus: two floors with generic, round measurements.
 *
 * WHY THIS EXISTS: the routing engine must be buildable and testable before the
 * real floor plans are digitized. This building is fictional and every dimension
 * is a round number (40 x 24 m) so nobody mistakes it for real data.
 *
 * Replacing it (Phase 3/7): import the digitized GeoJSON into `src/data/floors/`.
 * The shape below is exactly the documented `Floor` / `Building` model, so the
 * swap is a data change, not a code change.
 *
 * Layout (meters, origin at the south-west corner, +x east, +y north):
 *
 *    y=23  +---------+---------+---------+---------+
 *          | Aula 101| Aula 102| Aula 103| Aula 104|   north wing
 *    y=13  +---------+---------+---------+---------+
 *          |              PASILLO  (y 9..13)       |   corridor
 *     y=9  +---------+---------+---------+---------+
 *          |  Lobby  |  Biblio |  Baños  |Cafetería|   south wing
 *     y=1  +---------+---------+---------+---------+
 *         x=2                                     x=38
 */

import type {
  Building,
  CatalogEntry,
  Floor,
  GraphEdge,
  GraphNode,
  LocalPoint,
  Space,
  SpaceKind,
} from '@/domain/types'

const BUILDING_WIDTH = 40
const BUILDING_HEIGHT = 24

const CORRIDOR_Y1 = 9
const CORRIDOR_Y2 = 13
const NORTH_Y1 = 13
const NORTH_Y2 = 23
const SOUTH_Y1 = 1
const SOUTH_Y2 = 9

/** Corridor spine x positions. */
const CORRIDOR_XS = [4, 8, 12, 16, 20, 24, 28, 32, 36]

const STAIR_POINT: LocalPoint = { x: 37.2, y: 9.8 }
const ELEVATOR_POINT: LocalPoint = { x: 37.2, y: 12.2 }

/** Closed rectangle from two corners. */
function rect(x1: number, y1: number, x2: number, y2: number): LocalPoint[] {
  return [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
  ]
}

interface RoomSpec {
  id: string
  name: string
  kind: SpaceKind
  x1: number
  x2: number
  /** Door point, on the corridor-facing edge. */
  door: LocalPoint
  /** Corridor spine node the door connects to. */
  corridorNode: string
  aliases: string[]
  keywords: string[]
  capacity?: number
  restricted?: boolean
}

interface FloorSpec {
  floorId: string
  level: number
  levelLabel: string
  levelShort: string
  order: number
  hasEntrance: boolean
  northRooms: RoomSpec[]
  southRooms: RoomSpec[]
}

const FLOOR_SPECS: FloorSpec[] = [
  {
    floorId: 'edificio-demo-p1',
    level: 1,
    levelLabel: 'Piso 1',
    levelShort: 'P1',
    order: 1,
    hasEntrance: true,
    northRooms: [
      {
        id: 'A101',
        name: 'Aula 101',
        kind: 'classroom',
        x1: 2,
        x2: 11,
        door: { x: 6.5, y: NORTH_Y1 },
        corridorNode: 'c2',
        aliases: ['Aula 101', 'A101'],
        keywords: ['sistemas', 'informatica', 'clase'],
        capacity: 40,
      },
      {
        id: 'A102',
        name: 'Aula 102',
        kind: 'classroom',
        x1: 11,
        x2: 20,
        door: { x: 15.5, y: NORTH_Y1 },
        corridorNode: 'c4',
        aliases: ['Aula 102', 'A102'],
        keywords: ['matematicas', 'calculo'],
        capacity: 35,
      },
      {
        id: 'A103',
        name: 'Aula 103',
        kind: 'classroom',
        x1: 20,
        x2: 29,
        door: { x: 24.5, y: NORTH_Y1 },
        corridorNode: 'c6',
        aliases: ['Aula 103', 'A103'],
        keywords: ['fisica'],
        capacity: 30,
      },
      {
        id: 'A104',
        name: 'Aula 104',
        kind: 'classroom',
        x1: 29,
        x2: 38,
        door: { x: 33.5, y: NORTH_Y1 },
        corridorNode: 'c8',
        aliases: ['Aula 104', 'A104'],
        keywords: ['quimica'],
        capacity: 30,
      },
    ],
    southRooms: [
      {
        id: 'REC',
        name: 'Recepción',
        kind: 'office',
        x1: 2,
        x2: 12,
        door: { x: 7, y: SOUTH_Y2 },
        corridorNode: 'c2',
        aliases: ['Recepcion', 'Recep', 'Lobby', 'Entrada'],
        keywords: ['informacion', 'atencion', 'secretaria'],
      },
      {
        id: 'BIB',
        name: 'Biblioteca',
        kind: 'common',
        x1: 12,
        x2: 22,
        door: { x: 17, y: SOUTH_Y2 },
        corridorNode: 'c4',
        aliases: ['Biblioteca', 'Bib', 'Sala de estudio'],
        keywords: ['libros', 'estudio', 'hemeroteca'],
      },
      {
        id: 'BAN1',
        name: 'Baños',
        kind: 'bathroom',
        x1: 22,
        x2: 30,
        door: { x: 26, y: SOUTH_Y2 },
        corridorNode: 'c6',
        aliases: ['Banos', 'Bano', 'Servicios', 'Bateria de banos'],
        keywords: ['wc', 'aseo'],
      },
      {
        id: 'CAFE',
        name: 'Cafetería',
        kind: 'kitchen',
        x1: 30,
        x2: 38,
        door: { x: 34, y: SOUTH_Y2 },
        corridorNode: 'c8',
        aliases: ['Cafeteria', 'Cafe', 'Comedor', 'Restaurante'],
        keywords: ['comida', 'almuerzo', 'tienda'],
      },
    ],
  },
  {
    floorId: 'edificio-demo-p2',
    level: 2,
    levelLabel: 'Piso 2',
    levelShort: 'P2',
    order: 2,
    hasEntrance: false,
    northRooms: [
      {
        id: 'A201',
        name: 'Aula 201',
        kind: 'classroom',
        x1: 2,
        x2: 11,
        door: { x: 6.5, y: NORTH_Y1 },
        corridorNode: 'c2',
        aliases: ['Aula 201', 'A201'],
        keywords: ['sistemas'],
        capacity: 40,
      },
      {
        id: 'A202',
        name: 'Aula 202',
        kind: 'classroom',
        x1: 11,
        x2: 20,
        door: { x: 15.5, y: NORTH_Y1 },
        corridorNode: 'c4',
        aliases: ['Aula 202', 'A202'],
        keywords: ['matematicas'],
        capacity: 35,
      },
      {
        id: 'LABFIS',
        name: 'Laboratorio de Física',
        kind: 'laboratory',
        x1: 20,
        x2: 29,
        door: { x: 24.5, y: NORTH_Y1 },
        corridorNode: 'c6',
        aliases: ['Lab Fisica', 'Laboratorio Fisica', 'LF', 'Fisica'],
        keywords: ['laboratorio', 'experimentos'],
        capacity: 25,
      },
      {
        id: 'A204',
        name: 'Aula 204',
        kind: 'classroom',
        x1: 29,
        x2: 38,
        door: { x: 33.5, y: NORTH_Y1 },
        corridorNode: 'c8',
        aliases: ['Aula 204', 'A204'],
        keywords: ['idiomas', 'ingles'],
        capacity: 30,
      },
    ],
    southRooms: [
      {
        id: 'A205',
        name: 'Aula 205',
        kind: 'classroom',
        x1: 2,
        x2: 12,
        door: { x: 7, y: SOUTH_Y2 },
        corridorNode: 'c2',
        aliases: ['Aula 205', 'A205'],
        keywords: ['derecho'],
        capacity: 35,
      },
      {
        id: 'A206',
        name: 'Aula 206',
        kind: 'classroom',
        x1: 12,
        x2: 22,
        door: { x: 17, y: SOUTH_Y2 },
        corridorNode: 'c4',
        aliases: ['Aula 206', 'A206'],
        keywords: ['economia'],
        capacity: 35,
      },
      {
        id: 'BAN2',
        name: 'Baños',
        kind: 'bathroom',
        x1: 22,
        x2: 30,
        door: { x: 26, y: SOUTH_Y2 },
        corridorNode: 'c6',
        aliases: ['Banos', 'Bano', 'Servicios'],
        keywords: ['wc'],
      },
      {
        id: 'SALA2',
        name: 'Sala de estudio',
        kind: 'common',
        x1: 30,
        x2: 38,
        door: { x: 34, y: SOUTH_Y2 },
        corridorNode: 'c8',
        aliases: ['Sala de estudio', 'Estudio', 'Sala'],
        keywords: ['trabajo', 'grupo', 'silenciosa'],
        capacity: 20,
      },
    ],
  },
]

interface BuiltFloor {
  floor: Floor
  catalog: CatalogEntry[]
}

/** Turn one spec into a floor plus its catalog entries. */
function buildFloor(spec: FloorSpec): BuiltFloor {
  const prefix = spec.levelShort.toLowerCase()
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const spaces: Space[] = []
  const catalog: CatalogEntry[] = []

  const nodeIndex = new Map<string, GraphNode>()

  const addNode = (
    key: string,
    point: LocalPoint,
    kind: GraphNode['kind'],
    qrKey?: string,
  ): string => {
    const id = `${prefix}.${key}`
    const created: GraphNode = { id, point, kind, ...(qrKey === undefined ? {} : { qrKey }) }
    nodes.push(created)
    nodeIndex.set(id, created)
    return id
  }

  const connect = (
    from: string,
    to: string,
    kind: GraphEdge['kind'] = 'walkway',
    accessible = true,
  ): void => {
    const a = nodeIndex.get(from)
    const b = nodeIndex.get(to)
    if (!a || !b) return
    edges.push({
      from,
      to,
      kind,
      accessible,
      distance: Math.hypot(b.point.x - a.point.x, b.point.y - a.point.y),
    })
  }

  // Corridor spine.
  const corridorIds = CORRIDOR_XS.map((x, index) =>
    addNode(`c${index + 1}`, { x, y: 11 }, 'hallway'),
  )
  for (let i = 1; i < corridorIds.length; i += 1) {
    const prev = corridorIds[i - 1]
    const curr = corridorIds[i]
    if (prev && curr) connect(prev, curr)
  }

  // Vertical cores. The qrKey is identical on both floors on purpose: it is the
  // same physical staircase, and a sticker on the landing must resolve on both.
  const stairId = addNode('st1', STAIR_POINT, 'stair', 'N01')
  const elevatorId = addNode('ev1', ELEVATOR_POINT, 'elevator', 'N02')
  const lastCorridor = corridorIds[corridorIds.length - 1]
  if (lastCorridor) {
    connect(lastCorridor, stairId)
    connect(lastCorridor, elevatorId)
  }

  let qrCounter = 10

  const addRooms = (rooms: RoomSpec[], isNorth: boolean): void => {
    for (const room of rooms) {
      qrCounter += 1
      const doorId = addNode(`door-${room.id}`, room.door, 'door', `N${qrCounter}`)
      connect(doorId, `${prefix}.${room.corridorNode}`, 'door')

      spaces.push({
        id: room.id,
        name: room.name,
        aliases: room.aliases,
        kind: room.kind,
        ...(room.capacity === undefined ? {} : { capacity: room.capacity }),
        ...(room.restricted === undefined ? {} : { restricted: room.restricted }),
        anchorNodeId: doorId,
        polygon: isNorth
          ? rect(room.x1, NORTH_Y1, room.x2, NORTH_Y2)
          : rect(room.x1, SOUTH_Y1, room.x2, SOUTH_Y2),
      })

      catalog.push({
        id: room.id,
        name: room.name,
        aliases: room.aliases,
        keywords: room.keywords,
        buildingId: 'edificio-demo',
        floorId: spec.floorId,
        level: spec.level,
        kind: room.kind,
        active: true,
        ...(room.restricted === undefined ? {} : { restricted: room.restricted }),
      })
    }
  }

  addRooms(spec.northRooms, true)
  addRooms(spec.southRooms, false)

  // Entrance only exists on the ground floor.
  if (spec.hasEntrance) {
    const entranceId = addNode('ent', { x: 7, y: 0.5 }, 'entrance', 'N03')
    connect(entranceId, `${prefix}.door-REC`, 'door')
  }

  const transitions: Floor['transitions'] =
    spec.level === 1
      ? [
          {
            id: 'stair-up-p1-p2',
            type: 'stairs',
            fromNodeId: 'p1.st1',
            toNodeId: 'p2.st1',
            fromLevel: 1,
            toLevel: 2,
            accessible: false,
          },
          {
            id: 'elevator-up-p1-p2',
            type: 'elevator',
            fromNodeId: 'p1.ev1',
            toNodeId: 'p2.ev1',
            fromLevel: 1,
            toLevel: 2,
            accessible: true,
          },
        ]
      : [
          {
            id: 'stair-down-p2-p1',
            type: 'stairs',
            fromNodeId: 'p2.st1',
            toNodeId: 'p1.st1',
            fromLevel: 2,
            toLevel: 1,
            accessible: false,
          },
          {
            id: 'elevator-down-p2-p1',
            type: 'elevator',
            fromNodeId: 'p2.ev1',
            toNodeId: 'p1.ev1',
            fromLevel: 2,
            toLevel: 1,
            accessible: true,
          },
        ]

  return {
    floor: {
      id: spec.floorId,
      buildingId: 'edificio-demo',
      level: spec.level,
      levelLabel: spec.levelLabel,
      levelShort: spec.levelShort,
      order: spec.order,
      bounds: [0, 0, BUILDING_WIDTH, BUILDING_HEIGHT],
      spaces,
      walkways: [{ id: `${prefix}.corridor-main`, polygon: rect(2, CORRIDOR_Y1, 38, CORRIDOR_Y2) }],
      nodes,
      edges,
      transitions,
    },
    catalog,
  }
}

const built = FLOOR_SPECS.map(buildFloor)

export const demoFloors: Floor[] = built.map((entry) => entry.floor)

export const demoCatalog: CatalogEntry[] = built.flatMap((entry) => entry.catalog)

export const demoBuilding: Building = {
  id: 'edificio-demo',
  name: 'Edificio Demo',
  aliases: ['Edificio Demo', 'Demo', 'Pruebas'],
  campus: 'calle-100',
  // Fictional anchor near the real campus; replaced with surveyed coordinates later.
  origin: { lat: 4.683094, lng: -74.041943, rotation: 0 },
  levels: demoFloors.map((floor) => floor.id),
}
