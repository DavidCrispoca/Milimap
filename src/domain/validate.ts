/**
 * Data validation for floor plans.
 *
 * This module is the safety net for hand-made data. A broken graph does not crash
 * the app: it silently produces "no route found", which is indistinguishable from
 * a real dead end. Validation turns that silence into an explicit list of problems.
 *
 * The same code runs in three places on purpose, so there is one definition of
 * "valid":
 *   1. `tools/validate-plans.ts` (CI)
 *   2. the admin editor, live while drawing (Phase 3)
 *   3. tests
 */

import type { Campus } from './routing'
import type { Floor, NodeId } from './types'
import { polygonArea } from './geometry'

export type IssueSeverity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  severity: IssueSeverity
  code: string
  message: string
  /** Floor or entity the issue refers to, for the UI to highlight. */
  ref?: string
}

const MIN_POLYGON_POINTS = 3
const MIN_POLYGON_AREA_M2 = 0.5

/** Validate one floor in isolation. */
export function validateFloor(floor: Floor): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const nodeIds = new Set<NodeId>()
  const spaceIds = new Set<string>()

  // --- duplicate ids -------------------------------------------------
  for (const node of floor.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_NODE_ID',
        message: `El nodo "${node.id}" está repetido.`,
        ref: node.id,
      })
    }
    nodeIds.add(node.id)
  }

  for (const space of floor.spaces) {
    if (spaceIds.has(space.id)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_SPACE_ID',
        message: `El espacio "${space.id}" está repetido.`,
        ref: space.id,
      })
    }
    spaceIds.add(space.id)
  }

  // --- spaces --------------------------------------------------------
  for (const space of floor.spaces) {
    if (space.polygon.length < MIN_POLYGON_POINTS) {
      issues.push({
        severity: 'error',
        code: 'SPACE_POLYGON_TOO_SMALL',
        message: `El espacio "${space.name}" tiene menos de 3 puntos.`,
        ref: space.id,
      })
    } else if (polygonArea(space.polygon) < MIN_POLYGON_AREA_M2) {
      issues.push({
        severity: 'warning',
        code: 'SPACE_POLYGON_TOO_SMALL',
        message: `El espacio "${space.name}" tiene un área casi nula.`,
        ref: space.id,
      })
    }

    if (!space.anchorNodeId) {
      issues.push({
        severity: 'error',
        code: 'SPACE_WITHOUT_ANCHOR',
        message: `El espacio "${space.name}" no tiene nodo de anclaje.`,
        ref: space.id,
      })
    } else if (!nodeIds.has(space.anchorNodeId)) {
      issues.push({
        severity: 'error',
        code: 'SPACE_ANCHOR_MISSING',
        message: `El anclaje "${space.anchorNodeId}" del espacio "${space.name}" no existe en el piso.`,
        ref: space.id,
      })
    }
  }

  // --- edges ---------------------------------------------------------
  const degree = new Map<NodeId, number>()

  for (const edge of floor.edges) {
    if (!nodeIds.has(edge.from)) {
      issues.push({
        severity: 'error',
        code: 'EDGE_FROM_MISSING',
        message: `La arista apunta a un nodo de origen inexistente ("${edge.from}").`,
        ref: edge.from,
      })
    }
    if (!nodeIds.has(edge.to)) {
      issues.push({
        severity: 'error',
        code: 'EDGE_TO_MISSING',
        message: `La arista apunta a un nodo de destino inexistente ("${edge.to}").`,
        ref: edge.to,
      })
    }
    if (edge.from === edge.to) {
      issues.push({
        severity: 'error',
        code: 'EDGE_SELF_LOOP',
        message: `La arista "${edge.from}" se conecta consigo misma.`,
        ref: edge.from,
      })
    }
    if (!(edge.distance > 0)) {
      issues.push({
        severity: 'error',
        code: 'EDGE_INVALID_DISTANCE',
        message: `La arista "${edge.from}" → "${edge.to}" tiene distancia no positiva.`,
        ref: edge.from,
      })
    }

    degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1)
    degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1)
  }

  // --- transitions ---------------------------------------------------
  for (const transition of floor.transitions) {
    if (!nodeIds.has(transition.fromNodeId)) {
      issues.push({
        severity: 'error',
        code: 'TRANSITION_NODE_MISSING',
        message: `La transición "${transition.id}" apunta a un nodo inexistente en este piso.`,
        ref: transition.id,
      })
    }
    if (transition.fromLevel !== floor.level) {
      issues.push({
        severity: 'error',
        code: 'TRANSITION_LEVEL_MISMATCH',
        message: `La transición "${transition.id}" declara origen en el nivel ${transition.fromLevel} pero está en el ${floor.level}.`,
        ref: transition.id,
      })
    }
    if (transition.fromLevel === transition.toLevel) {
      issues.push({
        severity: 'error',
        code: 'TRANSITION_SAME_LEVEL',
        message: `La transición "${transition.id}" conecta el piso consigo mismo.`,
        ref: transition.id,
      })
    }
  }

  // --- orphan nodes --------------------------------------------------
  for (const node of floor.nodes) {
    if ((degree.get(node.id) ?? 0) === 0) {
      issues.push({
        severity: 'warning',
        code: 'ORPHAN_NODE',
        message: `El nodo "${node.id}" (${node.kind}) no tiene ninguna conexión.`,
        ref: node.id,
      })
    }
  }

  return issues
}

/** Validate the campus as a whole: every space must be reachable. */
export function validateCampus(campus: Campus): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const floor of campus.floors) {
    issues.push(...validateFloor(floor))
  }

  const floorByLevel = new Map<number, Floor>()
  for (const floor of campus.floors) floorByLevel.set(floor.level, floor)

  // Transitions must land on a floor that actually exists.
  for (const floor of campus.floors) {
    for (const transition of floor.transitions) {
      const targetFloor = floorByLevel.get(transition.toLevel)
      if (!targetFloor) {
        issues.push({
          severity: 'error',
          code: 'TRANSITION_FLOOR_MISSING',
          message: `La transición "${transition.id}" apunta al nivel ${transition.toLevel}, que no existe.`,
          ref: transition.id,
        })
        continue
      }

      const targetExists = targetFloor.nodes.some((node) => node.id === transition.toNodeId)
      if (!targetExists) {
        issues.push({
          severity: 'error',
          code: 'TRANSITION_TARGET_MISSING',
          message: `La transición "${transition.id}" apunta al nodo "${transition.toNodeId}", que no está en el ${targetFloor.levelLabel}.`,
          ref: transition.id,
        })
      }
    }
  }

  // Adjacency across the whole campus, including transitions.
  const adjacency = new Map<NodeId, NodeId[]>()
  const link = (a: NodeId, b: NodeId): void => {
    const list = adjacency.get(a)
    if (list) list.push(b)
    else adjacency.set(a, [b])
  }

  for (const floor of campus.floors) {
    for (const node of floor.nodes) if (!adjacency.has(node.id)) adjacency.set(node.id, [])
    for (const edge of floor.edges) {
      link(edge.from, edge.to)
      link(edge.to, edge.from)
    }
    for (const transition of floor.transitions) {
      link(transition.fromNodeId, transition.toNodeId)
      link(transition.toNodeId, transition.fromNodeId)
    }
  }

  // Entrances are the natural roots. Fall back to every node if there are none,
  // so a campus without marked entrances is not reported as fully disconnected.
  const entrances = campus.floors.flatMap((floor) =>
    floor.nodes.filter((node) => node.kind === 'entrance').map((node) => node.id),
  )
  const roots = entrances.length > 0 ? entrances : [...adjacency.keys()]

  const visited = new Set<NodeId>()
  const queue = [...roots]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current)) continue
    visited.add(current)
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) queue.push(next)
    }
  }

  for (const floor of campus.floors) {
    for (const space of floor.spaces) {
      if (!visited.has(space.anchorNodeId)) {
        issues.push({
          severity: 'error',
          code: 'SPACE_UNREACHABLE',
          message: `El espacio "${space.name}" (${floor.levelLabel}) no es alcanzable desde ninguna entrada.`,
          ref: space.id,
        })
      }
    }
  }

  // Connectivity summary: one component is healthy, more than one is suspicious.
  const components = countComponents(adjacency)
  if (components > 1) {
    issues.push({
      severity: 'warning',
      code: 'GRAPH_DISCONNECTED',
      message: `El grafo del campus tiene ${components} componentes separadas. Debería ser 1.`,
    })
  }

  if (!entrances.length) {
    issues.push({
      severity: 'warning',
      code: 'NO_ENTRANCE',
      message:
        'No hay ningún nodo marcado como "entrance". Sin entrada marcada no se puede validar alcanzabilidad real.',
    })
  }

  return issues
}

function countComponents(adjacency: Map<NodeId, NodeId[]>): number {
  const seen = new Set<NodeId>()
  let components = 0

  for (const start of adjacency.keys()) {
    if (seen.has(start)) continue
    components += 1
    const stack = [start]
    while (stack.length > 0) {
      const current = stack.pop()
      if (!current || seen.has(current)) continue
      seen.add(current)
      for (const next of adjacency.get(current) ?? []) {
        if (!seen.has(next)) stack.push(next)
      }
    }
  }

  return components
}

/** Convenience for CLI and UI: count issues by severity. */
export function summarize(issues: readonly ValidationIssue[]): {
  errors: number
  warnings: number
  infos: number
  ok: boolean
} {
  let errors = 0
  let warnings = 0
  let infos = 0
  for (const issue of issues) {
    if (issue.severity === 'error') errors += 1
    else if (issue.severity === 'warning') warnings += 1
    else infos += 1
  }
  return { errors, warnings, infos, ok: errors === 0 }
}
