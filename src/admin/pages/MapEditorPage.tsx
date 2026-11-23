/**
 * Phase 3: map editor.
 *
 * Edits the geometry that actually drives the app: room polygons, walkway
 * polygons and the walkable graph. The original digitized plans stay untouched;
 * edits are saved as a per-floor overlay in the content store, and the student
 * map applies that overlay when it builds its campus.
 *
 * DELIBERATE SCOPE: this is a desk tool for one operator, not a CAD editor. It
 * covers what the phase needs — draw, move, connect, delete, validate, save and
 * export — without layers, snapping to a grid, or multi-user locking.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calle100Campus } from '@/data'
import {
  applyMapEdits,
  cloneGeometry,
  geometryOf,
  geometryStats,
  type FloorGeometry,
} from '@/content/map-edits'
import { can } from '@/content/permissions'
import { useContentStore } from '@/content/store'
import type {
  EdgeKind,
  Floor,
  GraphNode,
  LocalPoint,
  NodeKind,
  Space,
  SpaceKind,
} from '@/domain/types'
import { validateCampus, type ValidationIssue } from '@/domain/validate'
import { Alert, Badge, Panel, Stat } from '../ui'

const PADDING = 4
const SNAP_METERS = 0.25
const MIN_SHAPE = 0.6
const HISTORY_LIMIT = 30
const MAX_ISSUES_SHOWN = 12

const SPACE_KINDS: Array<{ value: SpaceKind; label: string }> = [
  { value: 'classroom', label: 'Aula' },
  { value: 'laboratory', label: 'Laboratorio' },
  { value: 'office', label: 'Oficina' },
  { value: 'bathroom', label: 'Baño' },
  { value: 'common', label: 'Zona común' },
  { value: 'auditorium', label: 'Auditorio' },
  { value: 'gym', label: 'Gimnasio' },
  { value: 'kitchen', label: 'Cafetería / cocina' },
  { value: 'service', label: 'Servicio' },
]

const NODE_KINDS: Array<{ value: NodeKind; label: string }> = [
  { value: 'door', label: 'Puerta' },
  { value: 'hallway', label: 'Pasillo' },
  { value: 'junction', label: 'Bifurcación' },
  { value: 'stair', label: 'Escalera' },
  { value: 'elevator', label: 'Ascensor' },
  { value: 'anchor', label: 'Ancla de espacio' },
  { value: 'entrance', label: 'Entrada' },
]

const EDGE_KINDS: Array<{ value: EdgeKind; label: string }> = [
  { value: 'walkway', label: 'Pasillo' },
  { value: 'door', label: 'Puerta' },
  { value: 'stair', label: 'Escalera' },
  { value: 'elevator', label: 'Ascensor' },
  { value: 'ramp', label: 'Rampa' },
]

const TOOLS = [
  { id: 'select', label: 'Seleccionar', icon: '↖', hint: 'Elige y arrastra nodos o vértices.' },
  {
    id: 'space',
    label: 'Espacio',
    icon: '▭',
    hint: 'Arrastra sobre el plano para dibujar un salón.',
  },
  {
    id: 'walkway',
    label: 'Pasillo',
    icon: '▤',
    hint: 'Arrastra para dibujar una zona de circulación.',
  },
  { id: 'node', label: 'Nodo', icon: '●', hint: 'Clic para agregar un punto del grafo.' },
  { id: 'edge', label: 'Conexión', icon: '╱', hint: 'Clic en dos nodos para unirlos.' },
] as const

type Tool = (typeof TOOLS)[number]['id']

type Selection =
  | { kind: 'space'; id: string }
  | { kind: 'node'; id: string }
  | { kind: 'edge'; index: number }
  | { kind: 'walkway'; index: number }
  | null

type RectDraft = {
  tool: 'space' | 'walkway'
  start: LocalPoint
  current: LocalPoint
}

type PointDrag = { kind: 'node'; id: string } | { kind: 'vertex'; spaceId: string; index: number }

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

const round = (value: number): number => Math.round(value * 10) / 10

const snap = (value: number): number => Math.round(value / SNAP_METERS) * SNAP_METERS

function uniqueSpaceId(level: number, spaces: Space[]): string {
  const taken = new Set(spaces.map((space) => space.id))
  let index = spaces.length + 1
  let candidate = `EDIT-P${level}-${index}`
  while (taken.has(candidate)) {
    index += 1
    candidate = `EDIT-P${level}-${index}`
  }
  return candidate
}

function uniqueNodeId(level: number, nodes: GraphNode[]): string {
  const taken = new Set(nodes.map((node) => node.id))
  let index = nodes.length + 1
  let candidate = `c100-p${level}.edit-${index}`
  while (taken.has(candidate)) {
    index += 1
    candidate = `c100-p${level}.edit-${index}`
  }
  return candidate
}

function uniqueWalkwayId(level: number, walkways: Array<{ id: string }>): string {
  const taken = new Set(walkways.map((walkway) => walkway.id))
  let index = walkways.length + 1
  let candidate = `calle-p${level}-edit-${index}`
  while (taken.has(candidate)) {
    index += 1
    candidate = `calle-p${level}-edit-${index}`
  }
  return candidate
}

function nearestNode(nodes: GraphNode[], point: LocalPoint): GraphNode | null {
  let best: GraphNode | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const node of nodes) {
    const distance = Math.hypot(node.point.x - point.x, node.point.y - point.y)
    if (distance < bestDistance) {
      bestDistance = distance
      best = node
    }
  }
  return best
}

/** Edge costs are precomputed, so moving a node must refresh the ones it touches. */
function recomputeDistances(geometry: FloorGeometry): FloorGeometry {
  const byId = new Map(geometry.nodes.map((node) => [node.id, node]))
  return {
    ...geometry,
    edges: geometry.edges.map((edge) => {
      const from = byId.get(edge.from)
      const to = byId.get(edge.to)
      if (!from || !to) return edge
      const distance = round(Math.hypot(from.point.x - to.point.x, from.point.y - to.point.y))
      return distance === edge.distance ? edge : { ...edge, distance }
    }),
  }
}

function centroid(points: LocalPoint[]): LocalPoint {
  if (points.length === 0) return { x: 0, y: 0 }
  const sum = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), {
    x: 0,
    y: 0,
  })
  return { x: sum.x / points.length, y: sum.y / points.length }
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function MapEditorPage() {
  const role = useContentStore((state) => state.role)
  const mapEdits = useContentStore((state) => state.mapEdits)
  const canEdit = can(role, 'edit_space')

  const floors = useMemo(() => [...calle100Campus.floors].sort((a, b) => a.level - b.level), [])
  const [level, setLevel] = useState(1)
  const [dirty, setDirty] = useState(false)
  const floor = floors.find((candidate) => candidate.level === level) ?? floors[0]!

  const changeLevel = (next: number): void => {
    if (next === level) return
    if (dirty && !window.confirm('Este piso tiene cambios sin guardar. ¿Cambiar de todos modos?')) {
      return
    }
    setDirty(false)
    setLevel(next)
  }

  return (
    <>
      <Panel
        title="Mapa del edificio"
        subtitle="Polígonos de espacios, zonas de circulación y el grafo que usa el ruteo."
        actions={
          <div className="map-editor__floors" role="group" aria-label="Piso a editar">
            {floors.map((item) => (
              <button
                key={item.id}
                type="button"
                className="map-editor__floor"
                aria-pressed={item.level === floor.level}
                onClick={() => changeLevel(item.level)}
              >
                P{item.level}
                {mapEdits[item.id] ? (
                  <span className="map-editor__floor-dot" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        }
      >
        {!canEdit ? (
          <Alert
            tone="warning"
            title="Modo lectura"
            items={['Tu rol no permite editar la geometría. Entra como administrador o editor.']}
          />
        ) : null}
        <p className="muted">
          Los cambios se guardan en este navegador y el mapa público los usa de inmediato. Exporta
          el JSON cuando quieras congelar una versión en <span className="mono">src/data</span>.
        </p>
        <details className="map-editor__help">
          <summary>Cómo se usa el editor</summary>
          <ul>
            <li>
              <strong>Seleccionar:</strong> haz clic en un espacio, nodo o conexión. Arrastra los
              nodos y los vértices del espacio seleccionado.
            </li>
            <li>
              <strong>Espacio / Pasillo:</strong> arrastra un rectángulo sobre el plano. El espacio
              nuevo se ancla al nodo más cercano (o crea uno).
            </li>
            <li>
              <strong>Nodo / Conexión:</strong> agrega puntos del grafo y unilos para que el ruteo
              pueda caminar por ahí.
            </li>
            <li>
              <strong>Supr</strong> borra la selección y <strong>Ctrl+Z</strong> deshace el último
              cambio de esta sesión.
            </li>
            <li>
              Los nombres y alias se editan en <strong>Espacios</strong>; acá se edita la geometría.
            </li>
          </ul>
        </details>
      </Panel>

      <FloorEditor
        key={floor.id}
        floor={floor}
        saved={mapEdits[floor.id]}
        canEdit={canEdit}
        onDirtyChange={setDirty}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* One floor                                                           */
/* ------------------------------------------------------------------ */

interface FloorEditorProps {
  floor: Floor
  saved: FloorGeometry | undefined
  canEdit: boolean
  onDirtyChange: (dirty: boolean) => void
}

function FloorEditor({ floor, saved, canEdit, onDirtyChange }: FloorEditorProps) {
  const mapEdits = useContentStore((state) => state.mapEdits)
  const saveFloorGeometry = useContentStore((state) => state.saveFloorGeometry)
  const resetFloorGeometry = useContentStore((state) => state.resetFloorGeometry)

  const [geometry, setGeometry] = useState<FloorGeometry>(() =>
    cloneGeometry(saved ?? geometryOf(floor)),
  )
  const [baseline, setBaseline] = useState<FloorGeometry>(() =>
    cloneGeometry(saved ?? geometryOf(floor)),
  )
  const [history, setHistory] = useState<FloorGeometry[]>([])
  const [tool, setTool] = useState<Tool>('select')
  const [selection, setSelection] = useState<Selection>(null)
  const [pendingNode, setPendingNode] = useState<string | null>(null)
  const [rect, setRect] = useState<RectDraft | null>(null)
  const [pointDrag, setPointDrag] = useState<PointDrag | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [notice, setNotice] = useState<string | null>(null)

  const svgRef = useRef<SVGSVGElement | null>(null)

  const [minX, minY, maxX, maxY] = floor.bounds
  const width = maxX - minX + PADDING * 2
  const height = maxY - minY + PADDING * 2
  const unit = width / 90

  const toSvg = useCallback(
    (point: LocalPoint): { x: number; y: number } => ({
      x: point.x - minX + PADDING,
      y: maxY - point.y + PADDING,
    }),
    [minX, maxY],
  )

  const polygonPoints = useCallback(
    (points: LocalPoint[]): string =>
      points
        .map((point) => {
          const p = toSvg(point)
          return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
        })
        .join(' '),
    [toSvg],
  )

  const eventToLocal = (event: { clientX: number; clientY: number }): LocalPoint | null => {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return null
    const screen = svg.createSVGPoint()
    screen.x = event.clientX
    screen.y = event.clientY
    const local = screen.matrixTransform(matrix.inverse())
    return {
      x: snap(local.x + minX - PADDING),
      y: snap(maxY + PADDING - local.y),
    }
  }

  const dirty = useMemo(
    () => JSON.stringify(geometry) !== JSON.stringify(baseline),
    [geometry, baseline],
  )

  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  const activeTool = TOOLS.find((item) => item.id === tool) ?? TOOLS[0]!

  const selectedSpace =
    selection?.kind === 'space'
      ? (geometry.spaces.find((space) => space.id === selection.id) ?? null)
      : null
  const selectedNode =
    selection?.kind === 'node'
      ? (geometry.nodes.find((node) => node.id === selection.id) ?? null)
      : null
  const selectedEdge = selection?.kind === 'edge' ? (geometry.edges[selection.index] ?? null) : null
  const selectedWalkway =
    selection?.kind === 'walkway' ? (geometry.walkways[selection.index] ?? null) : null

  const stats = geometryStats(geometry)

  /** All edits funnel through here so history is recorded once per action. */
  const apply = useCallback(
    (updater: (current: FloorGeometry) => FloorGeometry, record = true): void => {
      if (!canEdit) return
      if (record) setHistory((stack) => [...stack.slice(-(HISTORY_LIMIT - 1)), geometry])
      setGeometry((current) => updater(current))
    },
    [canEdit, geometry],
  )

  const undo = useCallback((): void => {
    setHistory((stack) => {
      if (stack.length === 0) return stack
      setGeometry(stack[stack.length - 1]!)
      return stack.slice(0, -1)
    })
  }, [])

  const moveNode = (id: string, point: LocalPoint, record: boolean): void => {
    apply(
      (current) =>
        recomputeDistances({
          ...current,
          nodes: current.nodes.map((node) => (node.id === id ? { ...node, point } : node)),
        }),
      record,
    )
  }

  const moveVertex = (spaceId: string, index: number, point: LocalPoint, record: boolean): void => {
    apply(
      (current) => ({
        ...current,
        spaces: current.spaces.map((space) =>
          space.id === spaceId
            ? {
                ...space,
                polygon: space.polygon.map((vertex, vertexIndex) =>
                  vertexIndex === index ? point : vertex,
                ),
              }
            : space,
        ),
      }),
      record,
    )
  }

  const deleteSelection = useCallback((): void => {
    if (!canEdit || !selection) return

    if (selection.kind === 'space') {
      const space = geometry.spaces.find((candidate) => candidate.id === selection.id)
      apply((current) => ({
        ...current,
        spaces: current.spaces.filter((candidate) => candidate.id !== selection.id),
      }))
      setSelection(null)
      setNotice(space ? `Se eliminó «${space.name}» del piso.` : 'Espacio eliminado.')
      return
    }

    if (selection.kind === 'node') {
      const node = geometry.nodes.find((candidate) => candidate.id === selection.id)
      const anchored = geometry.spaces.filter((space) => space.anchorNodeId === selection.id)
      if (anchored.length > 0) {
        setNotice(
          `No se puede eliminar el nodo: es el ancla de ${anchored
            .slice(0, 2)
            .map((space) => space.name)
            .join(', ')}${anchored.length > 2 ? '…' : ''}.`,
        )
        return
      }
      const transitions = floor.transitions.filter(
        (transition) =>
          transition.fromNodeId === selection.id || transition.toNodeId === selection.id,
      )
      if (transitions.length > 0) {
        setNotice('No se puede eliminar el nodo: sostiene una conexión entre pisos.')
        return
      }
      apply((current) => ({
        ...current,
        nodes: current.nodes.filter((candidate) => candidate.id !== selection.id),
        edges: current.edges.filter(
          (edge) => edge.from !== selection.id && edge.to !== selection.id,
        ),
      }))
      setSelection(null)
      setNotice(node ? `Se eliminó el nodo ${node.id}.` : 'Nodo eliminado.')
      return
    }

    if (selection.kind === 'edge') {
      apply((current) => ({
        ...current,
        edges: current.edges.filter((_, index) => index !== selection.index),
      }))
      setSelection(null)
      setNotice('Conexión eliminada.')
      return
    }

    apply((current) => ({
      ...current,
      walkways: current.walkways.filter((_, index) => index !== selection.index),
    }))
    setSelection(null)
    setNotice('Pasillo eliminado.')
  }, [canEdit, selection, geometry, floor.transitions, apply])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        deleteSelection()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deleteSelection, undo])

  /* --- canvas interaction ------------------------------------------ */

  const handleNodePointerDown = (
    event: React.PointerEvent<SVGCircleElement>,
    node: GraphNode,
  ): void => {
    if (event.button !== 0) return
    event.stopPropagation()

    if (tool === 'edge') {
      handleNodeActivate(node)
      return
    }

    setSelection({ kind: 'node', id: node.id })
    if (!canEdit) return
    setHistory((stack) => [...stack.slice(-(HISTORY_LIMIT - 1)), geometry])
    setPointDrag({ kind: 'node', id: node.id })
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  const handleNodeActivate = (node: GraphNode): void => {
    if (tool !== 'edge') {
      setSelection({ kind: 'node', id: node.id })
      return
    }
    if (!canEdit) return

    if (!pendingNode) {
      setPendingNode(node.id)
      setNotice(`Primer nodo: ${node.id}. Elige el segundo.`)
      return
    }
    if (pendingNode === node.id) {
      setPendingNode(null)
      setNotice('Conexión cancelada.')
      return
    }

    const exists = geometry.edges.some(
      (edge) =>
        (edge.from === pendingNode && edge.to === node.id) ||
        (edge.from === node.id && edge.to === pendingNode),
    )
    if (exists) {
      setPendingNode(null)
      setNotice('Esos dos nodos ya están conectados.')
      return
    }

    const from = geometry.nodes.find((candidate) => candidate.id === pendingNode)
    if (!from) {
      setPendingNode(null)
      return
    }
    const distance = round(Math.hypot(from.point.x - node.point.x, from.point.y - node.point.y))
    const fromId = pendingNode
    apply((current) => ({
      ...current,
      edges: [
        ...current.edges,
        { from: fromId, to: node.id, kind: 'walkway', accessible: true, distance },
      ],
    }))
    setPendingNode(null)
    setNotice(`Conexión creada (${distance} m).`)
  }

  const handleVertexPointerDown = (
    event: React.PointerEvent<SVGCircleElement>,
    spaceId: string,
    index: number,
  ): void => {
    if (event.button !== 0 || !canEdit) return
    event.stopPropagation()
    setHistory((stack) => [...stack.slice(-(HISTORY_LIMIT - 1)), geometry])
    setPointDrag({ kind: 'vertex', spaceId, index })
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  const handleCanvasPointerDown = (event: React.PointerEvent<SVGSVGElement>): void => {
    if (event.button !== 0) return
    const point = eventToLocal(event)
    if (!point) return
    svgRef.current?.setPointerCapture(event.pointerId)

    if (tool === 'space' || tool === 'walkway') {
      setRect({ tool, start: point, current: point })
      return
    }
    if (tool === 'node') {
      if (!canEdit) return
      const id = uniqueNodeId(floor.level, geometry.nodes)
      const node: GraphNode = { id, point, kind: 'junction' }
      apply((current) => ({ ...current, nodes: [...current.nodes, node] }))
      setSelection({ kind: 'node', id })
      setNotice(`Nodo ${id} agregado.`)
      return
    }
    if (tool === 'edge') {
      setPendingNode(null)
      return
    }
    setSelection(null)
  }

  const handleCanvasPointerMove = (event: React.PointerEvent<SVGSVGElement>): void => {
    if (rect) {
      const point = eventToLocal(event)
      if (point) setRect({ ...rect, current: point })
      return
    }
    if (!pointDrag) return
    const point = eventToLocal(event)
    if (!point) return
    if (pointDrag.kind === 'node') moveNode(pointDrag.id, point, false)
    else moveVertex(pointDrag.spaceId, pointDrag.index, point, false)
  }

  const finishRect = (): void => {
    if (!rect) return
    const x1 = Math.min(rect.start.x, rect.current.x)
    const x2 = Math.max(rect.start.x, rect.current.x)
    const y1 = Math.min(rect.start.y, rect.current.y)
    const y2 = Math.max(rect.start.y, rect.current.y)
    setRect(null)

    if (x2 - x1 < MIN_SHAPE || y2 - y1 < MIN_SHAPE) return

    const polygon: LocalPoint[] = [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 },
      { x: x1, y: y2 },
    ]

    if (rect.tool === 'walkway') {
      const id = uniqueWalkwayId(floor.level, geometry.walkways)
      apply((current) => ({
        ...current,
        walkways: [
          ...current.walkways,
          { id, polygon, kind: 'pedestrian' } satisfies FloorGeometry['walkways'][number],
        ],
      }))
      setNotice('Pasillo agregado.')
      setSelection(null)
      setTool('select')
      return
    }

    const center = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
    const existingAnchor = nearestNode(geometry.nodes, center)
    const anchorNodeId = existingAnchor?.id ?? uniqueNodeId(floor.level, geometry.nodes)
    const nodes = existingAnchor
      ? geometry.nodes
      : [...geometry.nodes, { id: anchorNodeId, point: center, kind: 'anchor' } satisfies GraphNode]
    const id = uniqueSpaceId(floor.level, geometry.spaces)
    const space: Space = {
      id,
      name: `Espacio nuevo ${geometry.spaces.length + 1}`,
      aliases: [],
      kind: 'classroom',
      anchorNodeId,
      polygon,
    }
    apply((current) => ({ ...current, nodes, spaces: [...current.spaces, space] }))
    setSelection({ kind: 'space', id })
    setNotice(
      existingAnchor
        ? 'Espacio agregado y anclado al nodo más cercano.'
        : 'Espacio agregado con un nodo de ancla nuevo (conectalo al pasillo).',
    )
    setTool('select')
  }

  const handleCanvasPointerUp = (event: React.PointerEvent<SVGSVGElement>): void => {
    if (rect) finishRect()
    setPointDrag(null)
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }
  }

  /* --- property edits ---------------------------------------------- */

  const updateSpace = (id: string, patch: Partial<Space>): void => {
    apply((current) => ({
      ...current,
      spaces: current.spaces.map((space) => (space.id === id ? { ...space, ...patch } : space)),
    }))
  }

  const updateNode = (id: string, patch: Partial<GraphNode>): void => {
    apply((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    }))
  }

  const updateEdge = (index: number, patch: Partial<FloorGeometry['edges'][number]>): void => {
    apply((current) => ({
      ...current,
      edges: current.edges.map((edge, edgeIndex) =>
        edgeIndex === index ? { ...edge, ...patch } : edge,
      ),
    }))
  }

  const updateWalkway = (
    index: number,
    patch: Partial<FloorGeometry['walkways'][number]>,
  ): void => {
    apply((current) => ({
      ...current,
      walkways: current.walkways.map((walkway, walkwayIndex) =>
        walkwayIndex === index ? { ...walkway, ...patch } : walkway,
      ),
    }))
  }

  /* --- save / reset / export --------------------------------------- */

  const save = (): void => {
    if (!canEdit || !dirty) return
    if (!saveFloorGeometry(floor.id, geometry)) {
      setNotice('No se pudo guardar: revisa el rol de acceso.')
      return
    }
    setBaseline(cloneGeometry(geometry))
    setHistory([])
    setNotice('Geometría guardada. El mapa público ya la está usando.')
  }

  const discard = (): void => {
    setGeometry(cloneGeometry(baseline))
    setHistory([])
    setSelection(null)
    setNotice('Cambios descartados.')
  }

  const restoreOriginal = (): void => {
    if (!canEdit) return
    const confirmed = window.confirm(
      'Se descarta la edición guardada de este piso y se vuelve al plano digitalizado. ¿Continuar?',
    )
    if (!confirmed) return
    resetFloorGeometry(floor.id)
    const original = cloneGeometry(geometryOf(floor))
    setGeometry(original)
    setBaseline(original)
    setHistory([])
    setSelection(null)
    setNotice('Piso restaurado al plano digitalizado.')
  }

  const exportJson = (): void => {
    const payload = {
      floorId: floor.id,
      level: floor.level,
      levelLabel: floor.levelLabel,
      bounds: floor.bounds,
      ...geometry,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${floor.id}-geometria.json`
    link.click()
    URL.revokeObjectURL(url)
    setNotice('JSON exportado.')
  }

  /* --- validation --------------------------------------------------- */

  const previewCampus = useMemo(
    () => applyMapEdits(calle100Campus, { ...mapEdits, [floor.id]: geometry }),
    [mapEdits, floor.id, geometry],
  )
  const issues = useMemo(() => validateCampus(previewCampus), [previewCampus])
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  const locateIssueFloor = (ref?: string): number | null => {
    if (!ref) return null
    for (const candidate of previewCampus.floors) {
      const found =
        candidate.spaces.some((space) => space.id === ref) ||
        candidate.nodes.some((node) => node.id === ref) ||
        candidate.edges.some((edge) => edge.from === ref || edge.to === ref) ||
        candidate.transitions.some((transition) => transition.id === ref)
      if (found) return candidate.level
    }
    return null
  }

  const focusIssue = (issue: ValidationIssue): void => {
    if (!issue.ref) return
    const space = geometry.spaces.find((candidate) => candidate.id === issue.ref)
    if (space) {
      setSelection({ kind: 'space', id: space.id })
      return
    }
    const node = geometry.nodes.find((candidate) => candidate.id === issue.ref)
    if (node) {
      setSelection({ kind: 'node', id: node.id })
      return
    }
    const edgeIndex = geometry.edges.findIndex(
      (edge) => edge.from === issue.ref || edge.to === issue.ref,
    )
    if (edgeIndex >= 0) setSelection({ kind: 'edge', index: edgeIndex })
  }

  const visibleIssues = issues.filter((issue) => {
    const issueFloor = locateIssueFloor(issue.ref)
    return issueFloor === null || issueFloor === floor.level
  })
  const otherFloorIssues = issues.length - visibleIssues.length

  /* --- rendering helpers ------------------------------------------- */

  const rectPolygon = rect
    ? [
        { x: Math.min(rect.start.x, rect.current.x), y: Math.min(rect.start.y, rect.current.y) },
        { x: Math.max(rect.start.x, rect.current.x), y: Math.min(rect.start.y, rect.current.y) },
        { x: Math.max(rect.start.x, rect.current.x), y: Math.max(rect.start.y, rect.current.y) },
        { x: Math.min(rect.start.x, rect.current.x), y: Math.max(rect.start.y, rect.current.y) },
      ]
    : null

  return (
    <div className="map-editor">
      <section className="panel map-editor__canvas-panel">
        <header className="panel__header">
          <div>
            <h2 className="panel__title">
              {floor.levelLabel} <span className="muted">· {floor.levelShort}</span>
            </h2>
            <p className="panel__subtitle">
              {stats.spaces} espacios · {stats.nodes} nodos · {stats.edges} conexiones ·{' '}
              {stats.walkways} pasillos
            </p>
          </div>
          <div className="panel__actions map-editor__zoom">
            <label className="map-editor__zoom-label">
              <span>Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                aria-label="Zoom del plano"
              />
            </label>
          </div>
        </header>

        <div className="panel__body">
          <div className="map-editor__tools" role="toolbar" aria-label="Herramientas del editor">
            {TOOLS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="map-editor__tool"
                aria-pressed={tool === item.id}
                disabled={!canEdit && item.id !== 'select'}
                onClick={() => {
                  setTool(item.id)
                  setPendingNode(null)
                  setRect(null)
                }}
              >
                <span aria-hidden="true">{item.icon}</span> {item.label}
              </button>
            ))}
            <span className="map-editor__tool-sep" aria-hidden="true" />
            <button
              type="button"
              className="map-editor__tool"
              onClick={undo}
              disabled={history.length === 0}
            >
              ↶ Deshacer
            </button>
            <label className="map-editor__toggle">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(event) => setShowLabels(event.target.checked)}
              />
              Nombres
            </label>
          </div>

          <p className="map-editor__hint">
            <strong>{activeTool.label}:</strong> {activeTool.hint}
            {pendingNode ? ` · Nodo pendiente: ${pendingNode}` : ''}
          </p>
          {notice ? (
            <p className="map-editor__notice" role="status">
              {notice}
            </p>
          ) : null}

          <div className="map-editor__scroll">
            <svg
              ref={svgRef}
              className={`map-editor__svg map-editor__svg--${tool}`}
              viewBox={`0 0 ${width.toFixed(2)} ${height.toFixed(2)}`}
              style={{ width: `${zoom * 100}%` }}
              role="application"
              aria-label={`Editor del ${floor.levelLabel}`}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
            >
              <defs>
                <pattern
                  id={`map-editor-grid-${floor.level}`}
                  width={5}
                  height={5}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 5 0 L 0 0 0 5"
                    fill="none"
                    stroke="var(--color-ink-200)"
                    strokeWidth={0.06}
                  />
                </pattern>
              </defs>

              <rect width={width} height={height} fill={`url(#map-editor-grid-${floor.level})`} />

              {geometry.walkways.map((walkway, index) => (
                <polygon
                  key={walkway.id}
                  points={polygonPoints(walkway.polygon)}
                  className={`map-editor__walkway${
                    selection?.kind === 'walkway' && selection.index === index
                      ? ' map-editor__walkway--selected'
                      : ''
                  }`}
                  onClick={(event) => {
                    if (tool !== 'select') return
                    event.stopPropagation()
                    setSelection({ kind: 'walkway', index })
                  }}
                />
              ))}

              {geometry.spaces.map((space) => {
                const label = toSvg(centroid(space.polygon))
                const isSelected = selection?.kind === 'space' && selection.id === space.id
                return (
                  <g key={space.id}>
                    <polygon
                      points={polygonPoints(space.polygon)}
                      className={`map-editor__space${isSelected ? ' map-editor__space--selected' : ''}${
                        space.restricted ? ' map-editor__space--restricted' : ''
                      }`}
                      style={{ fill: `var(--map-space-${space.kind})` }}
                      onClick={(event) => {
                        if (tool !== 'select') return
                        event.stopPropagation()
                        setSelection({ kind: 'space', id: space.id })
                      }}
                    >
                      <title>
                        {space.name} ({space.id})
                      </title>
                    </polygon>
                    {showLabels ? (
                      <text
                        x={label.x}
                        y={label.y}
                        className="map-editor__space-label"
                        fontSize={unit * 1.15}
                        textAnchor="middle"
                        aria-hidden="true"
                      >
                        {space.name}
                      </text>
                    ) : null}
                  </g>
                )
              })}

              {geometry.edges.map((edge, index) => {
                const from = geometry.nodes.find((node) => node.id === edge.from)
                const to = geometry.nodes.find((node) => node.id === edge.to)
                if (!from || !to) return null
                const a = toSvg(from.point)
                const b = toSvg(to.point)
                const isSelected = selection?.kind === 'edge' && selection.index === index
                return (
                  <g key={`${edge.from}-${edge.to}-${index}`}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      className={`map-editor__edge${isSelected ? ' map-editor__edge--selected' : ''}`}
                      strokeWidth={unit * 0.14}
                    />
                    {tool === 'select' ? (
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke="transparent"
                        strokeWidth={unit * 0.9}
                        style={{ cursor: 'pointer' }}
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelection({ kind: 'edge', index })
                        }}
                      />
                    ) : null}
                  </g>
                )
              })}

              {selectedSpace
                ? selectedSpace.polygon.map((vertex, index) => {
                    const point = toSvg(vertex)
                    return (
                      <circle
                        key={`vertex-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={unit * 0.45}
                        className="map-editor__handle"
                        onPointerDown={(event) =>
                          handleVertexPointerDown(event, selectedSpace.id, index)
                        }
                      >
                        <title>Vértice {index + 1}</title>
                      </circle>
                    )
                  })
                : null}

              {geometry.nodes.map((node) => {
                const point = toSvg(node.point)
                const isSelected = selection?.kind === 'node' && selection.id === node.id
                const isPending = pendingNode === node.id
                return (
                  <g key={node.id}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={unit * (isSelected || isPending ? 0.75 : 0.55)}
                      className={`map-editor__node map-editor__node--${node.kind}${
                        isSelected ? ' map-editor__node--selected' : ''
                      }${isPending ? ' map-editor__node--pending' : ''}`}
                      onPointerDown={(event) => handleNodePointerDown(event, node)}
                    >
                      <title>
                        {node.id} · {node.kind}
                      </title>
                    </circle>
                    {node.qrKey && showLabels ? (
                      <text
                        x={point.x}
                        y={point.y - unit * 0.9}
                        className="map-editor__qr-label"
                        fontSize={unit * 0.8}
                        textAnchor="middle"
                        aria-hidden="true"
                      >
                        {node.qrKey}
                      </text>
                    ) : null}
                  </g>
                )
              })}

              {rectPolygon ? (
                <polygon
                  points={polygonPoints(rectPolygon)}
                  className="map-editor__rect"
                  pointerEvents="none"
                />
              ) : null}
            </svg>
          </div>

          <div className="map-editor__actions">
            <span className={`map-editor__state${dirty ? ' map-editor__state--dirty' : ''}`}>
              {dirty ? 'Cambios sin guardar' : saved ? 'Edición guardada' : 'Plano digitalizado'}
            </span>
            <button type="button" className="btn btn--sm" onClick={discard} disabled={!dirty}>
              Descartar
            </button>
            <button type="button" className="btn btn--sm" onClick={exportJson}>
              Exportar JSON
            </button>
            <button
              type="button"
              className="btn btn--sm btn--danger"
              onClick={restoreOriginal}
              disabled={!canEdit || !saved}
            >
              Restaurar original
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={save}
              disabled={!canEdit || !dirty}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </section>

      <aside className="map-editor__side">
        <Panel title="Propiedades">
          {selectedSpace ? (
            <div className="stack">
              <div>
                <p className="map-editor__name">{selectedSpace.name}</p>
                <p className="mono">{selectedSpace.id}</p>
              </div>
              <label className="field">
                <span className="field__label">Tipo de espacio</span>
                <select
                  className="select"
                  value={selectedSpace.kind}
                  onChange={(event) =>
                    updateSpace(selectedSpace.id, { kind: event.target.value as SpaceKind })
                  }
                >
                  {SPACE_KINDS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field__label">Nodo de llegada</span>
                <select
                  className="select"
                  value={selectedSpace.anchorNodeId}
                  onChange={(event) =>
                    updateSpace(selectedSpace.id, { anchorNodeId: event.target.value })
                  }
                >
                  {geometry.nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.id} · {node.kind}
                    </option>
                  ))}
                </select>
              </label>
              <p className="field__hint">
                {selectedSpace.polygon.length} vértices. Arrastralos en el plano para ajustar la
                forma.
              </p>
              <button
                type="button"
                className="btn btn--sm btn--danger"
                onClick={deleteSelection}
                disabled={!canEdit}
              >
                Eliminar espacio
              </button>
            </div>
          ) : selectedNode ? (
            <div className="stack">
              <p className="mono">{selectedNode.id}</p>
              <p className="muted">
                x {selectedNode.point.x.toFixed(1)} · y {selectedNode.point.y.toFixed(1)}
              </p>
              <label className="field">
                <span className="field__label">Tipo de nodo</span>
                <select
                  className="select"
                  value={selectedNode.kind}
                  onChange={(event) =>
                    updateNode(selectedNode.id, { kind: event.target.value as NodeKind })
                  }
                >
                  {NODE_KINDS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field__label">Clave de QR</span>
                <input
                  className="input"
                  value={selectedNode.qrKey ?? ''}
                  maxLength={12}
                  placeholder="N12"
                  onChange={(event) =>
                    updateNode(selectedNode.id, {
                      qrKey: event.target.value.trim() || undefined,
                    })
                  }
                />
                <span className="field__hint">
                  Es lo que se imprime en el sticker. Corto y estable.
                </span>
              </label>
              <button
                type="button"
                className="btn btn--sm btn--danger"
                onClick={deleteSelection}
                disabled={!canEdit}
              >
                Eliminar nodo
              </button>
            </div>
          ) : selectedEdge ? (
            <div className="stack">
              <p className="mono">
                {selectedEdge.from} → {selectedEdge.to}
              </p>
              <p className="muted">{selectedEdge.distance} m calculados</p>
              <label className="field">
                <span className="field__label">Tipo de conexión</span>
                <select
                  className="select"
                  value={selectedEdge.kind}
                  onChange={(event) =>
                    updateEdge(selection!.kind === 'edge' ? selection!.index : 0, {
                      kind: event.target.value as EdgeKind,
                    })
                  }
                >
                  {EDGE_KINDS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="map-editor__toggle">
                <input
                  type="checkbox"
                  checked={selectedEdge.accessible}
                  onChange={(event) =>
                    updateEdge(selection!.kind === 'edge' ? selection!.index : 0, {
                      accessible: event.target.checked,
                    })
                  }
                />
                Apta para ruta sin escaleras
              </label>
              <button
                type="button"
                className="btn btn--sm btn--danger"
                onClick={deleteSelection}
                disabled={!canEdit}
              >
                Eliminar conexión
              </button>
            </div>
          ) : selectedWalkway ? (
            <div className="stack">
              <p className="mono">{selectedWalkway.id}</p>
              <p className="muted">{selectedWalkway.polygon.length} vértices</p>
              <label className="field">
                <span className="field__label">Superficie</span>
                <select
                  className="select"
                  value={selectedWalkway.kind ?? 'pedestrian'}
                  onChange={(event) =>
                    updateWalkway(selection!.kind === 'walkway' ? selection!.index : 0, {
                      kind: event.target.value as 'pedestrian' | 'vehicular',
                    })
                  }
                >
                  <option value="pedestrian">Peatonal</option>
                  <option value="vehicular">Vehicular</option>
                </select>
              </label>
              <button
                type="button"
                className="btn btn--sm btn--danger"
                onClick={deleteSelection}
                disabled={!canEdit}
              >
                Eliminar pasillo
              </button>
            </div>
          ) : (
            <div className="stack">
              <p className="muted">
                Nada seleccionado. Elige un espacio, un nodo o una conexión en el plano.
              </p>
              <div className="stat-grid map-editor__stats">
                <Stat label="Espacios" value={stats.spaces} />
                <Stat label="Nodos" value={stats.nodes} />
                <Stat label="Conexiones" value={stats.edges} />
                <Stat label="Pasillos" value={stats.walkways} />
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Validación"
          subtitle="Las mismas reglas que usa el ruteo y el validador de CI."
          actions={
            <span className="map-editor__issues-count">
              <Badge tone={errors.length > 0 ? 'danger' : 'published'}>
                {errors.length} errores
              </Badge>{' '}
              <Badge tone={warnings.length > 0 ? 'warning' : 'draft'}>
                {warnings.length} avisos
              </Badge>
            </span>
          }
        >
          {errors.length > 0 ? (
            <Alert
              tone="danger"
              title="El plano tiene errores de grafo"
              items={errors.slice(0, 4).map((issue) => issue.message)}
            />
          ) : (
            <Alert tone="success" title="Sin errores de validación" />
          )}

          {visibleIssues.length > 0 ? (
            <ul className="map-editor__issues">
              {visibleIssues.slice(0, MAX_ISSUES_SHOWN).map((issue, index) => {
                const issueFloor = locateIssueFloor(issue.ref)
                const canFocus = issueFloor === floor.level && issue.ref
                return (
                  <li key={`${issue.code}-${issue.ref ?? 'floor'}-${index}`}>
                    <Badge
                      tone={
                        issue.severity === 'error'
                          ? 'danger'
                          : issue.severity === 'warning'
                            ? 'warning'
                            : 'info'
                      }
                    >
                      {issue.severity}
                    </Badge>
                    <span>{issue.message}</span>
                    {canFocus ? (
                      <button type="button" className="link-btn" onClick={() => focusIssue(issue)}>
                        Ir
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : null}

          {visibleIssues.length > MAX_ISSUES_SHOWN ? (
            <p className="muted">y {visibleIssues.length - MAX_ISSUES_SHOWN} más en este piso.</p>
          ) : null}
          {otherFloorIssues > 0 ? (
            <p className="muted">
              Hay {otherFloorIssues} avisos en otros pisos; se ven al abrirlos.
            </p>
          ) : null}
        </Panel>
      </aside>
    </div>
  )
}
