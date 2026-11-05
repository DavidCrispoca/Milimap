/**
 * Phase 1 demo screen: proves the routing engine end to end.
 *
 * It is NOT the final map (that is Phase 4 with MapLibre). It exists so the team
 * and the university can *feel* the navigation before any floor is digitized:
 * pick where you are, pick where you want to go, read the instructions.
 *
 * Everything shown here comes from the same `domain/` code the real screens will
 * use. Nothing is hard-coded per screen.
 */

import { useRef, useState } from 'react'
import { demoBuilding, demoCampus, demoCatalog, findSpace, sortedFloors } from '@/data'
import { buildGraphIndex, computeRoute } from '@/domain/routing'
import { searchDestinations } from '@/domain/search'
import type { Floor, LocalPoint, NodeId, Route, SpaceId } from '@/domain/types'
import { FloorPlanSvg } from '@/ui/FloorPlanSvg'
import { useContentStore } from '@/content/store'
import { mergedCatalog } from '@/content/catalog'

const graphIndex = buildGraphIndex(demoCampus)
const floors = sortedFloors(demoCampus)

interface QrPoint {
  nodeId: NodeId
  label: string
  floorLabel: string
  level: number
}

/** QR stickers only live on nodes that carry a stable `qrKey`. */
function buildQrPoints(): QrPoint[] {
  const points: QrPoint[] = []

  for (const floor of floors) {
    for (const node of floor.nodes) {
      if (!node.qrKey) continue
      points.push({
        nodeId: node.id,
        label: describeNode(floor, node.id),
        floorLabel: floor.levelShort,
        level: floor.level,
      })
    }
  }

  // Entrance first: it is the most likely origin for a first-time visitor.
  return points.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    if (a.label.startsWith('Entrada')) return -1
    if (b.label.startsWith('Entrada')) return 1
    return a.label.localeCompare(b.label, 'es')
  })
}

function describeNode(floor: Floor, nodeId: NodeId): string {
  const node = floor.nodes.find((candidate) => candidate.id === nodeId)
  if (!node) return 'Punto'

  if (node.kind === 'entrance') return 'Entrada principal'
  if (node.kind === 'stair') return `Escalera ${floor.levelShort}`
  if (node.kind === 'elevator') return `Ascensor ${floor.levelShort}`

  const space = floor.spaces.find((candidate) => candidate.anchorNodeId === node.id)
  return space ? space.name : `Puerta ${floor.levelShort}`
}

const QR_POINTS = buildQrPoints()

interface Preset {
  label: string
  origin: NodeId
  destination: SpaceId
}

const PRESETS: Preset[] = [
  { label: 'Entrada → Aula 104', origin: 'p1.ent', destination: 'A104' },
  { label: 'Entrada → Lab. Física', origin: 'p1.ent', destination: 'LABFIS' },
  { label: 'Aula 101 → Cafetería', origin: 'p1.door-A101', destination: 'CAFE' },
  { label: 'Aula 205 → Biblioteca', origin: 'p2.door-A205', destination: 'BIB' },
]

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`
  return `${Math.round(seconds / 60)} min`
}

/** Resolve a node id to its floor level and point. Returns null if unknown. */
function findPointForNode(nodeId: NodeId): { level: number; point: LocalPoint } | null {
  for (const floor of floors) {
    const node = floor.nodes.find((candidate) => candidate.id === nodeId)
    if (node) return { level: floor.level, point: node.point }
  }
  return null
}

export function RouteDemoScreen({ initialDestination }: { initialDestination?: SpaceId }) {
  const [originNodeId, setOriginNodeId] = useState<NodeId>('p1.ent')
  const [destinationSpaceId, setDestinationSpaceId] = useState<SpaceId | null>(
    initialDestination ?? 'A104',
  )
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<number>(1)
  const spaceEdits = useContentStore((state) => state.spaceEdits)
  const routeRef = useRef<HTMLElement | null>(null)

  // These are cheap, pure computations over a 16-space catalog, so they run on
  // every render instead of being memoized. Simpler and no stale-closure risk.
  // Search the catalog with admin edits applied: a renamed or hidden room must
  // behave the same here as in the admin panel.
  const hits = searchDestinations(mergedCatalog(demoCatalog, spaceEdits), query, {
    buildingId: demoBuilding.id,
    limit: 6,
  })

  const destinationSpace = destinationSpaceId ? findSpace(destinationSpaceId) : null

  const originPoint = findPointForNode(originNodeId)

  const destinationAnchor = destinationSpace
    ? findPointForNode(destinationSpace.anchorNodeId)
    : null

  const result = destinationSpace
    ? computeRoute(
        graphIndex,
        { originNodeId, destinationNodeId: destinationSpace.anchorNodeId },
        { destinationName: destinationSpace.name },
      )
    : null

  const route: Route | null = result?.ok ? result.route : null

  const currentFloor = floors.find((floor) => floor.level === level) ?? floors[0]

  // Bring the result into view after choosing a destination. Without this the
  // plan sits below the fold on a phone and the interaction feels dead.
  const revealRoute = (): void => {
    requestAnimationFrame(() => {
      routeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const applyPreset = (preset: Preset): void => {
    setOriginNodeId(preset.origin)
    setDestinationSpaceId(preset.destination)
    setQuery('')
    const origin = QR_POINTS.find((point) => point.nodeId === preset.origin)
    if (origin) setLevel(origin.level)
    revealRoute()
  }

  const chooseDestination = (spaceId: SpaceId, spaceLevel: number): void => {
    setDestinationSpaceId(spaceId)
    setQuery('')
    // Follow the route: show the floor where the destination lives.
    setLevel(spaceLevel)
    revealRoute()
  }

  return (
    <>
      <section className="card card--brand">
        <p className="card__eyebrow">Fase 1 · Motor de ruteo</p>
        <h1 className="card__title">Probá la navegación</h1>
        <p className="card__body">
          Edificio de demostración con medidas genéricas (40 × 24 m). Elegí dónde estás y a dónde
          vas. Las distancias y los pasos los calcula el mismo motor que va a usar el campus real.
        </p>
        <div className="pill-row">
          <span className="pill pill--brand">Dijkstra multipiso</span>
          <span className="pill pill--brand">85 tests</span>
          <span className="pill pill--brand">{graphIndex.nodes.size} nodos</span>
        </div>
      </section>

      <section className="card">
        <p className="card__eyebrow">Rutas de ejemplo</p>
        <div className="preset-row">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="preset"
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <label className="field">
          <span className="field__label">Estoy en</span>
          <select
            className="field__input"
            value={originNodeId}
            onChange={(event) => {
              const nextId = event.target.value
              setOriginNodeId(nextId)
              const point = QR_POINTS.find((candidate) => candidate.nodeId === nextId)
              if (point) setLevel(point.level)
            }}
          >
            {QR_POINTS.map((point) => (
              <option key={point.nodeId} value={point.nodeId}>
                {point.floorLabel} · {point.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Quiero ir a</span>
          <input
            className="field__input"
            type="search"
            placeholder="Aula 104, lab fisica, cafetería…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {destinationSpace ? (
          <p className="muted">
            Destino: <strong>{destinationSpace.name}</strong>
          </p>
        ) : null}

        {query.trim().length > 0 ? (
          <ul className="result-list">
            {hits.length === 0 ? (
              <li className="result-list__empty">
                Sin coincidencias. Probá con el código del aula.
              </li>
            ) : (
              hits.map((hit) => (
                <li key={hit.entry.id}>
                  <button
                    type="button"
                    className="result"
                    onClick={() => chooseDestination(hit.entry.id, hit.entry.level)}
                  >
                    <span>{hit.entry.name}</span>
                    <span className="result__meta">
                      {hit.entry.level === 1 ? 'P1' : `P${hit.entry.level}`}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </section>

      {result && !result.ok ? (
        <section className="card card--danger">
          <h2 className="card__title">No se pudo calcular la ruta</h2>
          <p className="card__body">Código: {result.code}</p>
        </section>
      ) : null}

      {route ? (
        <section className="card" ref={routeRef}>
          <div className="summary">
            <div className="summary__item">
              <span className="summary__value">{Math.round(route.totalMeters)} m</span>
              <span className="summary__label">distancia</span>
            </div>
            <div className="summary__item">
              <span className="summary__value">{formatDuration(route.estimatedSeconds)}</span>
              <span className="summary__label">a pie</span>
            </div>
            <div className="summary__item">
              <span className="summary__value">{route.steps.length}</span>
              <span className="summary__label">pasos</span>
            </div>
            <div className="summary__item">
              <span className="summary__value">
                {route.hasStairs ? 'Escaleras' : route.hasElevators ? 'Ascensor' : 'Plano'}
              </span>
              <span className="summary__label">desnivel</span>
            </div>
          </div>

          <div className="floor-chips" role="tablist" aria-label="Seleccionar piso">
            {floors.map((floor) => {
              const inRoute = route.levelsVisited.includes(floor.level)
              return (
                <button
                  key={floor.id}
                  type="button"
                  role="tab"
                  aria-selected={floor.level === level}
                  className={`chip${floor.level === level ? ' chip--active' : ''}${
                    inRoute ? '' : ' chip--muted'
                  }`}
                  onClick={() => setLevel(floor.level)}
                >
                  {floor.levelShort}
                  {inRoute ? <span className="chip__dot" aria-hidden="true" /> : null}
                </button>
              )
            })}
          </div>

          {currentFloor ? (
            <FloorPlanSvg
              floor={currentFloor}
              route={route}
              origin={originPoint}
              destination={destinationAnchor}
              highlightSpaceId={destinationSpace?.id ?? null}
              description={`Plano del ${currentFloor.levelLabel} con la ruta calculada`}
            />
          ) : null}

          {!route.levelsVisited.includes(level) ? (
            <p className="muted">
              La ruta no pasa por el {currentFloor?.levelLabel}. Usá los pisos marcados con punto.
            </p>
          ) : null}

          <ol className="step-list">
            {route.steps.map((step) => {
              const isCurrentFloor = step.level === level
              return (
                <li
                  key={`${step.index}-${step.kind}`}
                  className={`step${isCurrentFloor ? '' : ' step--other-floor'}`}
                >
                  <button
                    type="button"
                    className="step__button"
                    onClick={() => setLevel(step.level)}
                  >
                    <span className={`step__icon step__icon--${step.kind}`} aria-hidden="true">
                      {iconForStep(step.kind)}
                    </span>
                    <span className="step__body">
                      <span className="step__text">{step.instruction}</span>
                      <span className="step__meta">
                        {step.levelLabel}
                        {step.distanceMeters > 0 ? ` · ${Math.round(step.distanceMeters)} m` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      ) : null}
    </>
  )
}

function iconForStep(kind: string): string {
  switch (kind) {
    case 'start':
      return '▶'
    case 'turn':
      return '↱'
    case 'stairs':
      return '🪜'
    case 'elevator':
      return '🛗'
    case 'destination':
      return '⚑'
    default:
      return '↑'
  }
}
