/**
 * Turns a computed node path into human instructions.
 *
 * This file is the difference between "a list of coordinates" and "un Google
 * Maps adentro de la universidad". It is pure logic: given the same path it
 * always produces the same sentences, which is what makes it testable.
 *
 * Language: every step carries Spanish and English text. Spanish is the primary
 * language for students; English exists because the university has exchange
 * students and international staff.
 */

import { distance, turnAngle } from './geometry'
import { DEFAULT_PROFILE, type RoutingProfile } from './profile'
import type { Floor, GraphNode, LocalPoint, NodeId, Route, RouteStep, StepKind } from './types'
import type { PathResult } from './routing'

/** Minimum node shape needed by the builder; `GraphIndex` satisfies it. */
export interface StepBuildContext {
  nodes: Map<NodeId, { floor: Floor; node: GraphNode }>
  profile?: RoutingProfile
}

export interface BuildRouteOptions {
  originName?: string
  destinationName?: string
}

/** Below this angle change, a turn is not worth mentioning. */
const TURN_THRESHOLD_DEG = 25
const SLIGHT_TURN_DEG = 60
const SHARP_TURN_DEG = 135

/** Format a walking distance the way a person would say it. */
function formatMeters(meters: number): string {
  const rounded = Math.max(1, Math.round(meters))
  return `${rounded} m`
}

interface TurnPhrase {
  es: string
  en: string
  kind: StepKind
}

/** Map a signed angle change to wording. `null` means "keep going straight". */
function describeTurn(angleDeg: number): TurnPhrase | null {
  const magnitude = Math.abs(angleDeg)
  if (magnitude < TURN_THRESHOLD_DEG) return null

  // Sign convention: the plane has +y pointing north, so a positive angle is
  // counter-clockwise, which on a map is a LEFT turn. Negative = clockwise = right.
  const isRight = angleDeg < 0

  if (magnitude < SLIGHT_TURN_DEG) {
    return isRight
      ? { es: 'Siga ligeramente a la derecha', en: 'Bear slightly right', kind: 'turn' }
      : { es: 'Siga ligeramente a la izquierda', en: 'Bear slightly left', kind: 'turn' }
  }

  if (magnitude < SHARP_TURN_DEG) {
    return isRight
      ? { es: 'Gire a la derecha', en: 'Turn right', kind: 'turn' }
      : { es: 'Gire a la izquierda', en: 'Turn left', kind: 'turn' }
  }

  return { es: 'Dé la vuelta', en: 'Turn around', kind: 'turn' }
}

interface Leg {
  /** Points of this leg, starting at the previous split point. */
  points: LocalPoint[]
  /** Turn that started this leg; `null` for the very first leg of a floor. */
  turn: TurnPhrase | null
  meters: number
}

/**
 * Split a polyline at meaningful turns.
 *
 * Consecutive collinear points are collapsed into a single leg on purpose: a
 * corridor modelled with 12 nodes must read as "avance 24 m", not as 12 steps.
 */
export function splitIntoLegs(points: readonly LocalPoint[]): Leg[] {
  if (points.length < 2) return []

  const legs: Leg[] = []
  let currentStart = 0
  let currentTurn: TurnPhrase | null = null

  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]
    if (!prev || !curr || !next) continue

    const angle = turnAngle(prev, curr, next)
    const phrase = describeTurn(angle)
    if (!phrase) continue

    const slice = points.slice(currentStart, i + 1)
    legs.push({ points: slice, turn: currentTurn, meters: legLength(slice) })
    currentStart = i
    currentTurn = phrase
  }

  const tail = points.slice(currentStart)
  legs.push({ points: tail, turn: currentTurn, meters: legLength(tail) })

  return legs.filter((leg) => leg.meters > 0.05 || legs.length === 1)
}

function legLength(points: readonly LocalPoint[]): number {
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]
    const b = points[i]
    if (!a || !b) continue
    total += distance(a, b)
  }
  return total
}

/** Wording for a vertical transition, including up/down direction. */
function describeTransition(
  kind: 'stairs' | 'elevator',
  toLabel: string,
  goingUp: boolean,
): { es: string; en: string } {
  if (kind === 'stairs') {
    return goingUp
      ? { es: `Suba por las escaleras hasta el ${toLabel}`, en: `Take the stairs up to ${toLabel}` }
      : {
          es: `Baje por las escaleras hasta el ${toLabel}`,
          en: `Take the stairs down to ${toLabel}`,
        }
  }

  return goingUp
    ? { es: `Tome el ascensor hasta el ${toLabel}`, en: `Take the elevator up to ${toLabel}` }
    : { es: `Tome el ascensor hasta el ${toLabel}`, en: `Take the elevator down to ${toLabel}` }
}

/**
 * Build the full route: steps, totals and flags.
 *
 * `path` must come from `findPath`, because the edge kinds drive the wording.
 */
export function buildRoute(
  context: StepBuildContext,
  path: PathResult,
  options: BuildRouteOptions = {},
): Route {
  const profile = context.profile ?? DEFAULT_PROFILE
  const steps: RouteStep[] = []
  const levelsVisited = new Set<number>()
  let totalMeters = 0
  let estimatedSeconds = 0
  let hasStairs = false
  let hasElevators = false
  let elevatorRides = 0

  const lookup = (id: NodeId) => context.nodes.get(id)
  const firstNode = path.nodeIds[0] ? lookup(path.nodeIds[0]) : undefined

  // Degenerate case: origin equals destination.
  if (!firstNode || path.nodeIds.length <= 1) {
    const name = options.destinationName ?? 'su destino'
    return {
      steps: [
        {
          index: 0,
          instruction: `Ya está en ${name}`,
          instructionEn: `You are already at ${name}`,
          distanceMeters: 0,
          points: firstNode ? [firstNode.node.point] : [],
          level: firstNode?.floor.level ?? 0,
          levelLabel: firstNode?.floor.levelLabel ?? '',
          kind: 'destination',
        },
      ],
      nodeIds: path.nodeIds,
      totalMeters: 0,
      estimatedSeconds: 0,
      levelsVisited: firstNode ? [firstNode.floor.level] : [],
      hasStairs: false,
      hasElevators: false,
    }
  }

  let legPoints: LocalPoint[] = [firstNode.node.point]
  let legFloor: Floor = firstNode.floor
  levelsVisited.add(legFloor.level)

  const flushFloorLeg = (isFirstOverall: boolean): void => {
    if (legPoints.length < 2) return
    const legs = splitIntoLegs(legPoints)

    legs.forEach((leg, legIndex) => {
      const isVeryFirst = isFirstOverall && legIndex === 0
      const prefix = leg.turn

      let instruction: string
      let instructionEn: string
      let kind: StepKind

      if (prefix) {
        instruction = `${prefix.es} y avance ${formatMeters(leg.meters)}`
        instructionEn = `${prefix.en} and walk ${formatMeters(leg.meters)}`
        kind = 'turn'
      } else {
        instruction = `Avance ${formatMeters(leg.meters)}`
        instructionEn = `Walk ${formatMeters(leg.meters)}`
        kind = isVeryFirst ? 'start' : 'walk'
      }

      steps.push({
        index: steps.length,
        instruction,
        instructionEn,
        distanceMeters: leg.meters,
        points: leg.points,
        level: legFloor.level,
        levelLabel: legFloor.levelLabel,
        kind,
      })

      totalMeters += leg.meters
      estimatedSeconds += leg.meters / profile.walkSpeedMps
    })
  }

  let isFirstOverall = true

  for (const edge of path.edges) {
    const from = lookup(edge.from)
    const to = lookup(edge.to)
    if (!from || !to) continue

    const isTransition = edge.transitionId !== undefined

    if (isTransition) {
      flushFloorLeg(isFirstOverall)
      isFirstOverall = false

      const goingUp = to.floor.level > from.floor.level
      const transitionKind: 'stairs' | 'elevator' = edge.kind === 'elevator' ? 'elevator' : 'stairs'
      const phrase = describeTransition(transitionKind, to.floor.levelLabel, goingUp)

      if (transitionKind === 'stairs') hasStairs = true
      else {
        hasElevators = true
        elevatorRides += 1
      }

      // Vertical travel is real walking distance, so it belongs in the totals.
      // Without this a two-floor route would report the same distance as the
      // same route on one floor, which understates time badly.
      const verticalMeters = Math.abs(to.floor.level - from.floor.level) * profile.floorHeightMeters
      totalMeters += verticalMeters
      estimatedSeconds += verticalMeters / profile.walkSpeedMps

      steps.push({
        index: steps.length,
        instruction: phrase.es,
        instructionEn: phrase.en,
        distanceMeters: verticalMeters,
        // A vertical connection has no meaningful 2D footprint on either floor,
        // so it carries no polyline. The UI shows it as a card, not a line.
        points: [],
        level: from.floor.level,
        levelLabel: from.floor.levelLabel,
        kind: transitionKind === 'stairs' ? 'stairs' : 'elevator',
        ...(edge.transitionId === undefined ? {} : { transitionId: edge.transitionId }),
      })

      legPoints = [to.node.point]
      legFloor = to.floor
      levelsVisited.add(legFloor.level)
      continue
    }

    legPoints.push(to.node.point)
    levelsVisited.add(to.floor.level)
  }

  flushFloorLeg(isFirstOverall)

  // Time spent waiting for elevators is real, so it goes into the estimate.
  estimatedSeconds += elevatorRides * profile.elevatorWaitSeconds

  const destinationName = options.destinationName
  if (destinationName) {
    const lastNode = path.nodeIds[path.nodeIds.length - 1]
    const last = lastNode ? lookup(lastNode) : undefined
    steps.push({
      index: steps.length,
      instruction: `Ha llegado a ${destinationName}`,
      instructionEn: `You have arrived at ${destinationName}`,
      distanceMeters: 0,
      points: last ? [last.node.point] : [],
      level: last?.floor.level ?? legFloor.level,
      levelLabel: last?.floor.levelLabel ?? legFloor.levelLabel,
      kind: 'destination',
    })
  }

  return {
    steps,
    nodeIds: path.nodeIds,
    totalMeters,
    estimatedSeconds: Math.round(estimatedSeconds),
    levelsVisited: [...levelsVisited].sort((a, b) => a - b),
    hasStairs,
    hasElevators,
  }
}
