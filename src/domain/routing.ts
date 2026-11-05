/**
 * Routing engine: builds a multi-floor walkable graph from floor data and finds
 * the cheapest route with Dijkstra.
 *
 * Why Dijkstra and not A*: a campus has ~100 nodes per floor. At that size the
 * heuristic saves microseconds but makes the code harder to verify. Correctness
 * and readability win.
 *
 * Why the graph is flattened across floors: stairs and elevators connect nodes
 * that live on different floors. Treating them as ordinary edges means the
 * algorithm never needs to know about "levels" at all. Levels only matter when
 * turning the path into human instructions.
 */

import type {
  Building,
  EdgeKind,
  Floor,
  NodeId,
  PathEdge,
  Route,
  RouteErrorCode,
  RouteRequest,
  TransitionId,
} from './types'
import { buildRoute } from './steps'
import { DEFAULT_PROFILE, type RoutingProfile } from './profile'

/** A campus is one building plus its floors. Multi-building support is Phase 3+. */
export interface Campus {
  building: Building
  floors: Floor[]
}

export { DEFAULT_PROFILE }
export type { RoutingProfile }

/** Internal adjacency entry used by Dijkstra. */
interface Arc {
  to: NodeId
  cost: number
  kind: EdgeKind
  transitionId?: TransitionId
}

export interface GraphIndex {
  /** Node metadata, with the floor it belongs to. */
  nodes: Map<NodeId, { floor: Floor; node: Floor['nodes'][number] }>
  adjacency: Map<NodeId, Arc[]>
  profile: RoutingProfile
}

/** Cost of a horizontal edge according to its kind. */
function horizontalCost(kind: EdgeKind, meters: number, profile: RoutingProfile): number {
  switch (kind) {
    case 'stair':
      return meters * profile.stairPenalty
    case 'elevator':
      return meters * profile.elevatorPenalty
    case 'walkway':
    case 'door':
    case 'ramp':
      return meters
  }
}

/**
 * Build the flattened adjacency map. Edges are treated as bidirectional: a
 * corridor can be walked both ways and a corridor is not a one-way street.
 */
export function buildGraphIndex(
  campus: Campus,
  profile: RoutingProfile = DEFAULT_PROFILE,
): GraphIndex {
  const nodes = new Map<NodeId, { floor: Floor; node: Floor['nodes'][number] }>()
  const adjacency = new Map<NodeId, Arc[]>()
  const waitMeters = profile.elevatorWaitSeconds * profile.walkSpeedMps

  const push = (from: NodeId, arc: Arc): void => {
    const list = adjacency.get(from)
    if (list) {
      list.push(arc)
    } else {
      adjacency.set(from, [arc])
    }
  }

  for (const floor of campus.floors) {
    for (const node of floor.nodes) {
      nodes.set(node.id, { floor, node })
      if (!adjacency.has(node.id)) adjacency.set(node.id, [])
    }

    for (const edge of floor.edges) {
      // Guard against bad data: a dangling edge must not crash the router.
      if (!nodes.has(edge.from) || !nodes.has(edge.to)) continue
      if (edge.from === edge.to) continue

      const cost = horizontalCost(edge.kind, edge.distance, profile)
      push(edge.from, { to: edge.to, cost, kind: edge.kind })
      push(edge.to, { to: edge.from, cost, kind: edge.kind })
    }
  }

  // Vertical transitions. Bidirectional: you can go up and back down.
  for (const floor of campus.floors) {
    for (const transition of floor.transitions) {
      if (!nodes.has(transition.fromNodeId) || !nodes.has(transition.toNodeId)) continue
      if (transition.fromNodeId === transition.toNodeId) continue

      const levels = Math.abs(transition.toLevel - transition.fromLevel)
      const meters = levels * profile.floorHeightMeters
      const base =
        transition.type === 'stairs'
          ? meters * profile.stairPenalty
          : transition.type === 'elevator'
            ? meters * profile.elevatorPenalty + waitMeters
            : meters

      const kind: EdgeKind = transition.type === 'stairs' ? 'stair' : 'elevator'
      // A transition declared inaccessible is only skipped for step-free routing,
      // which is enforced during traversal, not here.
      push(transition.fromNodeId, {
        to: transition.toNodeId,
        cost: base,
        kind,
        transitionId: transition.id,
      })
      push(transition.toNodeId, {
        to: transition.fromNodeId,
        cost: base,
        kind,
        transitionId: transition.id,
      })
    }
  }

  return { nodes, adjacency, profile }
}

/** Minimal binary min-heap. Keeps Dijkstra O(E log V) instead of O(V^2). */
class MinHeap {
  private readonly keys: number[] = []
  private readonly values: string[] = []

  get size(): number {
    return this.keys.length
  }

  push(key: number, value: string): void {
    this.keys.push(key)
    this.values.push(value)
    let i = this.keys.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if ((this.keys[parent] ?? 0) <= (this.keys[i] ?? 0)) break
      this.swap(i, parent)
      i = parent
    }
  }

  pop(): { key: number; value: string } | null {
    if (this.keys.length === 0) return null
    const key = this.keys[0] ?? 0
    const value = this.values[0] ?? ''
    const lastKey = this.keys.pop()
    const lastValue = this.values.pop()

    if (this.keys.length > 0 && lastKey !== undefined && lastValue !== undefined) {
      this.keys[0] = lastKey
      this.values[0] = lastValue
      let i = 0
      for (;;) {
        const left = 2 * i + 1
        const right = left + 1
        let smallest = i
        if (left < this.keys.length && (this.keys[left] ?? 0) < (this.keys[smallest] ?? 0)) {
          smallest = left
        }
        if (right < this.keys.length && (this.keys[right] ?? 0) < (this.keys[smallest] ?? 0)) {
          smallest = right
        }
        if (smallest === i) break
        this.swap(i, smallest)
        i = smallest
      }
    }

    return { key, value }
  }

  private swap(a: number, b: number): void {
    const k = this.keys[a]
    const v = this.values[a]
    this.keys[a] = this.keys[b] ?? 0
    this.values[a] = this.values[b] ?? ''
    this.keys[b] = k ?? 0
    this.values[b] = v ?? ''
  }
}

export interface PathResult {
  nodeIds: NodeId[]
  edges: PathEdge[]
  /** Total cost in meter-equivalents, not the real walked distance. */
  cost: number
}

export interface PathOptions {
  avoidStairs?: boolean
  avoidElevators?: boolean
}

/** Edge kinds that must be skipped for the given preferences. */
function isBlocked(kind: EdgeKind, options: PathOptions): boolean {
  if (kind === 'stair' && options.avoidStairs) return true
  if (kind === 'elevator' && options.avoidElevators) return true
  return false
}

/**
 * Dijkstra. Returns `null` when no path exists, which callers must handle: a
 * disconnected graph is a data bug, not an exception.
 */
export function findPath(
  index: GraphIndex,
  originId: NodeId,
  destinationId: NodeId,
  options: PathOptions = {},
): PathResult | null {
  if (!index.nodes.has(originId) || !index.nodes.has(destinationId)) return null
  if (originId === destinationId) return { nodeIds: [originId], edges: [], cost: 0 }

  const dist = new Map<NodeId, number>()
  const prev = new Map<NodeId, { from: NodeId; kind: EdgeKind; transitionId?: TransitionId }>()
  const settled = new Set<NodeId>()

  dist.set(originId, 0)
  const heap = new MinHeap()
  heap.push(0, originId)

  while (heap.size > 0) {
    const top = heap.pop()
    if (!top) break
    const current = top.value
    if (settled.has(current)) continue
    settled.add(current)

    if (current === destinationId) break

    const arcs = index.adjacency.get(current) ?? []
    const currentCost = dist.get(current) ?? Infinity

    for (const arc of arcs) {
      if (settled.has(arc.to)) continue
      if (isBlocked(arc.kind, options)) continue

      const candidate = currentCost + arc.cost
      if (candidate < (dist.get(arc.to) ?? Infinity)) {
        dist.set(arc.to, candidate)
        prev.set(arc.to, { from: current, kind: arc.kind, transitionId: arc.transitionId })
        heap.push(candidate, arc.to)
      }
    }
  }

  if (!dist.has(destinationId)) return null

  // Walk the predecessor chain back to the origin.
  const nodeIds: NodeId[] = [destinationId]
  const edges: PathEdge[] = []
  let cursor = destinationId

  while (cursor !== originId) {
    const step = prev.get(cursor)
    if (!step) return null
    edges.push({
      from: step.from,
      to: cursor,
      kind: step.kind,
      ...(step.transitionId === undefined ? {} : { transitionId: step.transitionId }),
    })
    nodeIds.push(step.from)
    cursor = step.from
  }

  nodeIds.reverse()
  edges.reverse()

  return { nodeIds, edges, cost: dist.get(destinationId) ?? 0 }
}

/**
 * Full pipeline: resolve nodes, route, and build human instructions.
 * Failures are typed results, never exceptions, so the UI can react to each one.
 */
export function computeRoute(
  index: GraphIndex,
  request: RouteRequest,
  options: { destinationName?: string; originName?: string } = {},
): { ok: true; route: Route } | { ok: false; code: RouteErrorCode } {
  if (index.nodes.size === 0) return { ok: false, code: 'GRAPH_EMPTY' }
  if (!index.nodes.has(request.originNodeId)) return { ok: false, code: 'ORIGIN_NOT_FOUND' }
  if (!index.nodes.has(request.destinationNodeId)) {
    return { ok: false, code: 'DESTINATION_NOT_FOUND' }
  }

  const path = findPath(index, request.originNodeId, request.destinationNodeId, {
    ...(request.avoidStairs === undefined ? {} : { avoidStairs: request.avoidStairs }),
    ...(request.avoidElevators === undefined ? {} : { avoidElevators: request.avoidElevators }),
  })

  if (!path) return { ok: false, code: 'NO_PATH' }

  return {
    ok: true,
    route: buildRoute(index, path, {
      ...(options.destinationName === undefined
        ? {}
        : { destinationName: options.destinationName }),
      ...(options.originName === undefined ? {} : { originName: options.originName }),
    }),
  }
}

/** Convenience for tests and the validator: is `to` reachable from `from`? */
export function isReachable(
  index: GraphIndex,
  from: NodeId,
  to: NodeId,
  options: PathOptions = {},
): boolean {
  return findPath(index, from, to, options) !== null
}
