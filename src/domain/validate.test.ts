import { describe, expect, it } from 'vitest'
import { demoCampus } from '@/data'
import { summarize, validateCampus, validateFloor } from './validate'
import type { Campus } from './routing'
import type { Floor } from './types'

const codes = (issues: ReadonlyArray<{ code: string }>) => issues.map((issue) => issue.code)

describe('validateCampus on the demo data', () => {
  it('reports no errors, which is what CI enforces', () => {
    const issues = validateCampus(demoCampus)
    const summary = summarize(issues)
    expect(summary.errors).toBe(0)
    expect(summary.ok).toBe(true)
  })

  it('finds no orphan nodes in a healthy graph', () => {
    expect(codes(validateCampus(demoCampus))).not.toContain('ORPHAN_NODE')
  })

  it('sees exactly one connected component', () => {
    expect(codes(validateCampus(demoCampus))).not.toContain('GRAPH_DISCONNECTED')
  })
})

describe('validateFloor', () => {
  const baseFloor = demoCampus.floors[0]!
  const clone = (patch: Partial<Floor>): Floor => ({ ...baseFloor, ...patch })

  it('flags a space whose anchor node does not exist', () => {
    const floor = clone({
      spaces: baseFloor.spaces.map((space) =>
        space.id === 'A101' ? { ...space, anchorNodeId: 'ghost' } : space,
      ),
    })
    expect(codes(validateFloor(floor))).toContain('SPACE_ANCHOR_MISSING')
  })

  it('flags an edge pointing at a missing node', () => {
    const floor = clone({
      edges: [
        ...baseFloor.edges,
        { from: 'p1.c1', to: 'phantom', kind: 'walkway', accessible: true, distance: 3 },
      ],
    })
    expect(codes(validateFloor(floor))).toContain('EDGE_TO_MISSING')
  })

  it('flags an edge with non-positive distance', () => {
    const floor = clone({
      edges: [
        ...baseFloor.edges,
        { from: 'p1.c1', to: 'p1.c2', kind: 'walkway', accessible: true, distance: 0 },
      ],
    })
    expect(codes(validateFloor(floor))).toContain('EDGE_INVALID_DISTANCE')
  })

  it('flags a self-loop', () => {
    const floor = clone({
      edges: [
        ...baseFloor.edges,
        { from: 'p1.c1', to: 'p1.c1', kind: 'walkway', accessible: true, distance: 2 },
      ],
    })
    expect(codes(validateFloor(floor))).toContain('EDGE_SELF_LOOP')
  })

  it('flags duplicate node ids', () => {
    const duplicated = baseFloor.nodes[0]!
    const floor = clone({ nodes: [...baseFloor.nodes, { ...duplicated }] })
    expect(codes(validateFloor(floor))).toContain('DUPLICATE_NODE_ID')
  })

  it('warns about an orphan node', () => {
    const floor = clone({
      nodes: [...baseFloor.nodes, { id: 'p1.lonely', point: { x: 1, y: 1 }, kind: 'junction' }],
    })
    const issues = validateFloor(floor)
    expect(codes(issues)).toContain('ORPHAN_NODE')
    expect(issues.find((issue) => issue.code === 'ORPHAN_NODE')?.severity).toBe('warning')
  })

  it('flags a space with a degenerate polygon', () => {
    const floor = clone({
      spaces: baseFloor.spaces.map((space) =>
        space.id === 'A101' ? { ...space, polygon: [space.polygon[0]!, space.polygon[1]!] } : space,
      ),
    })
    expect(codes(validateFloor(floor))).toContain('SPACE_POLYGON_TOO_SMALL')
  })
})

describe('validateCampus structural checks', () => {
  const first = demoCampus.floors[0]!

  it('reports a transition pointing at a floor that does not exist', () => {
    const campus: Campus = {
      building: demoCampus.building,
      floors: [
        {
          ...first,
          transitions: [
            {
              id: 'ghost-up',
              type: 'stairs',
              fromNodeId: 'p1.st1',
              toNodeId: 'p9.st1',
              fromLevel: 1,
              toLevel: 9,
              accessible: false,
            },
          ],
        },
      ],
    }
    expect(codes(validateCampus(campus))).toContain('TRANSITION_FLOOR_MISSING')
  })

  it('reports a transition whose target node is missing on the target floor', () => {
    const campus: Campus = {
      building: demoCampus.building,
      floors: [
        {
          ...first,
          transitions: [
            {
              id: 'bad-target',
              type: 'stairs',
              fromNodeId: 'p1.st1',
              toNodeId: 'p2.nowhere',
              fromLevel: 1,
              toLevel: 2,
              accessible: false,
            },
          ],
        },
        demoCampus.floors[1]!,
      ],
    }
    expect(codes(validateCampus(campus))).toContain('TRANSITION_TARGET_MISSING')
  })

  it('reports a space that cannot be reached from any entrance', () => {
    const island = {
      id: 'ISO',
      name: 'Isla',
      aliases: [],
      kind: 'classroom' as const,
      anchorNodeId: 'p1.island',
      polygon: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
    }

    const campus: Campus = {
      building: demoCampus.building,
      floors: [
        {
          ...first,
          nodes: [...first.nodes, { id: 'p1.island', point: { x: 0, y: 0 }, kind: 'junction' }],
          spaces: [...first.spaces, island],
        },
      ],
    }

    const issues = validateCampus(campus)
    expect(codes(issues)).toContain('SPACE_UNREACHABLE')
    expect(codes(issues)).toContain('GRAPH_DISCONNECTED')
  })

  it('warns when no entrance is marked', () => {
    const campus: Campus = {
      building: demoCampus.building,
      floors: [
        {
          ...first,
          nodes: first.nodes.filter((node) => node.kind !== 'entrance'),
          edges: first.edges.filter((edge) => !edge.from.startsWith('p1.ent')),
        },
      ],
    }
    expect(codes(validateCampus(campus))).toContain('NO_ENTRANCE')
  })
})
