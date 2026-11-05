/**
 * Core domain types for Milimap.
 *
 * SCOPE (MVP): Calle 100 campus only.
 *
 * DESIGN RULE: `src/domain` must stay framework-free. No React, no MapLibre,
 * no Supabase imports in this folder. That keeps the routing engine testable in
 * plain Node and reusable if a native app is built later.
 *
 * UNITS: all geometry is expressed in METERS using a per-building local origin,
 * never lat/lng. Rationale: a floor is ~50x30 m, and in degrees two points 2 m
 * apart differ by ~1.8e-5, which collapses at float32 precision inside GPU
 * vertex buffers. Local meters keep full precision, make walk distances a plain
 * hypotenuse, and keep JSON diffs readable in Git.
 */

/** Stable identifiers. Plain string aliases, not enums: `erasableSyntaxOnly` is on. */
export type CampusId = string
export type BuildingId = string
export type FloorId = string
export type SpaceId = string
export type NodeId = string
export type EdgeId = string
export type TransitionId = string

/** A point in floor-local meter coordinates. Origin is the building's reference corner. */
export interface LocalPoint {
  x: number
  y: number
}

/** Axis-aligned bounds in meters: [minX, minY, maxX, maxY]. */
export type Bounds = [number, number, number, number]

/**
 * Geographic anchor for a building. Converts local meters <-> WGS84.
 * `rotation` is the angle of the local +Y axis vs true north, in radians.
 */
export interface BuildingOrigin {
  lat: number
  lng: number
  rotation: number
}

/** Room categories drive icon, colour and default filtering in the UI. */
export type SpaceKind =
  | 'classroom'
  | 'laboratory'
  | 'office'
  | 'bathroom'
  | 'common'
  | 'auditorium'
  | 'gym'
  | 'kitchen'
  | 'service'

/** Kinds of walkable graph nodes. */
export type NodeKind =
  'door' | 'hallway' | 'junction' | 'stair' | 'elevator' | 'anchor' | 'entrance'

/** Kinds of walkable graph edges. Drives cost penalties in routing. */
export type EdgeKind = 'walkway' | 'stair' | 'elevator' | 'door' | 'ramp'

/** Vertical connection type between two floors. */
export type TransitionType = 'stairs' | 'elevator' | 'ramp'

/** A room, zone or facility a user can navigate to. */
export interface Space {
  id: SpaceId
  name: string
  /** Alternative spellings users actually type. Improves search recall. */
  aliases: string[]
  kind: SpaceKind
  capacity?: number
  /** Graph node the user is routed to when arriving at this space. */
  anchorNodeId: NodeId
  /** Outline in floor-local meters, as a closed ring of points. */
  polygon: LocalPoint[]
  /** Hidden from the public map but kept in the internal catalog. */
  restricted?: boolean
}

/** A traversable corridor area. This is the surface people actually walk on. */
export interface Walkway {
  id: string
  polygon: LocalPoint[]
}

/** A routed point on the floor graph. */
export interface GraphNode {
  id: NodeId
  point: LocalPoint
  kind: NodeKind
  /**
   * Stable short identifier printed inside QR codes (e.g. `N12`). Node ids are
   * internal and may change with refactors; a sticker on a wall cannot.
   */
  qrKey?: string
}

/** A traversable connection between two nodes on the same floor. */
export interface GraphEdge {
  from: NodeId
  to: NodeId
  kind: EdgeKind
  /** False excludes the edge when the user asks for a step-free route. */
  accessible: boolean
  /** Real walk distance in meters. Precomputed so routing stays stateless. */
  distance: number
}

/** A vertical connection linking a node on one floor to a node on another. */
export interface Transition {
  id: TransitionId
  type: TransitionType
  fromNodeId: NodeId
  toNodeId: NodeId
  fromLevel: number
  toLevel: number
  accessible: boolean
}

/**
 * One floor of a building. This is the central data object: it holds the
 * geometry the map renders and the graph the router walks.
 */
export interface Floor {
  id: FloorId
  buildingId: BuildingId
  level: number
  levelLabel: string
  levelShort: string
  /** Sort order for the floor selector. Basements are negative. */
  order: number
  bounds: Bounds
  spaces: Space[]
  walkways: Walkway[]
  nodes: GraphNode[]
  edges: GraphEdge[]
  transitions: Transition[]
}

/** A building: holds geo anchor plus its floor list. */
export interface Building {
  id: BuildingId
  name: string
  aliases: string[]
  campus: CampusId
  origin: BuildingOrigin
  /** Floor ids in display order. */
  levels: FloorId[]
}

/** Catalog entry used by search. Decoupled from floor geometry on purpose. */
export interface CatalogEntry {
  id: SpaceId
  name: string
  aliases: string[]
  keywords: string[]
  buildingId: BuildingId
  floorId: FloorId
  level: number
  kind: SpaceKind
  active: boolean
  restricted?: boolean
}

/* ------------------------------------------------------------------ */
/* Routing                                                             */
/* ------------------------------------------------------------------ */

export interface RouteRequest {
  originNodeId: NodeId
  destinationNodeId: NodeId
  /** Exclude stairs entirely (step-free routing). */
  avoidStairs?: boolean
  avoidElevators?: boolean
}

/** Semantic category of a single instruction. Drives the icon shown. */
export type StepKind = 'start' | 'walk' | 'turn' | 'stairs' | 'elevator' | 'destination'

export interface RouteStep {
  index: number
  instruction: string
  instructionEn: string
  distanceMeters: number
  /** Polyline for this leg, in the local coords of `level`. */
  points: LocalPoint[]
  level: number
  levelLabel: string
  kind: StepKind
  transitionId?: TransitionId
}

export interface Route {
  steps: RouteStep[]
  /** Full node sequence the route traverses, for debugging and analytics. */
  nodeIds: NodeId[]
  totalMeters: number
  estimatedSeconds: number
  /** Floors touched, in ascending level order. */
  levelsVisited: number[]
  hasStairs: boolean
  hasElevators: boolean
}

/**
 * One traversed edge of a computed path. The router returns edges (not only
 * node ids) because the instruction builder needs to know *how* two consecutive
 * nodes are connected: a stair ride reads differently from a corridor walk.
 */
export interface PathEdge {
  from: NodeId
  to: NodeId
  kind: EdgeKind
  transitionId?: TransitionId
}

/** Typed failure instead of throwing: callers must handle "no route". */
export type RouteErrorCode =
  'ORIGIN_NOT_FOUND' | 'DESTINATION_NOT_FOUND' | 'NO_PATH' | 'GRAPH_EMPTY'

export type RouteResult = { ok: true; route: Route } | { ok: false; code: RouteErrorCode }

/* ------------------------------------------------------------------ */
/* QR payload                                                          */
/* ------------------------------------------------------------------ */

/**
 * QR payloads point at GRAPH NODES, never raw coordinates.
 * If a node is nudged, the JSON changes and every printed sticker keeps working.
 *
 * Wire format: MILIMAP:v1:EDIFICIO-A:P1:N12
 */
export interface QrPayload {
  version: 1
  buildingId: BuildingId
  floorKey: string
  nodeKey: string
}

export type QrParseError = 'NOT_MILIMAP' | 'UNSUPPORTED_VERSION' | 'MALFORMED'
export type QrParseResult = { ok: true; payload: QrPayload } | { ok: false; code: QrParseError }
