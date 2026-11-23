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

import { useMemo, useRef, useState } from 'react'
import {
  calle100Building,
  calle100Campus,
  calle100Catalog,
  demoBuilding,
  demoCampus,
  demoCatalog,
  findSpace,
  sortedFloors,
} from '@/data'
import { buildGraphIndex, computeRoute } from '@/domain/routing'
import { searchDestinations } from '@/domain/search'
import type { Floor, LocalPoint, NodeId, Route, SpaceId } from '@/domain/types'
import { FloorPlanSvg } from '@/ui/FloorPlanSvg'
import { useContentStore } from '@/content/store'
import { mergedCatalog } from '@/content/catalog'
import { applyMapEdits } from '@/content/map-edits'
import { usePreferences } from '@/ui/preferences'

interface QrPoint {
  nodeId: NodeId
  label: string
  floorLabel: string
  level: number
}

function buildQrPoints(floors: Floor[]): QrPoint[] {
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

  if (node.kind === 'entrance') return `Entrada (${node.qrKey ?? 'Acceso'})`
  if (node.kind === 'stair') return `Escalera ${node.qrKey ?? floor.levelShort}`
  if (node.kind === 'elevator') return `Ascensor ${node.qrKey ?? floor.levelShort}`

  const space = floor.spaces.find((candidate) => candidate.anchorNodeId === node.id)
  return space ? space.name : `Punto ${node.qrKey ?? floor.levelShort}`
}

interface Preset {
  label: string
  origin: NodeId
  destination: SpaceId
}

const CALLE100_PRESETS: Preset[] = [
  { label: 'Entrada D → Aula E 101 (P1)', origin: 'c100-p1.ent-d', destination: 'AULA-E101' },
  { label: 'Entrada D → Aula D 202 (P2)', origin: 'c100-p1.ent-d', destination: 'D202' },
  { label: 'Entrada C → Aula C 308 (P3)', origin: 'c100-p1.ent-c', destination: 'C308' },
  { label: 'Entrada E → Aula E 407 (P4)', origin: 'c100-p1.ent-e', destination: 'E407' },
  { label: 'Entrada E → Lab Multimedia (P5)', origin: 'c100-p1.ent-e', destination: 'LAB3-MULTI' },
  {
    label: 'Entrada E → Aula Máxima (exterior P1)',
    origin: 'c100-p1.ent-e',
    destination: 'AULA-MAXIMA-EXT',
  },
]

const DEMO_PRESETS: Preset[] = [
  { label: 'Entrada → Aula 104', origin: 'p1.ent', destination: 'A104' },
  { label: 'Entrada → Lab. Física', origin: 'p1.ent', destination: 'LABFIS' },
  { label: 'Aula 101 → Cafetería', origin: 'p1.door-A101', destination: 'CAFE' },
  { label: 'Aula 205 → Biblioteca', origin: 'p2.door-A205', destination: 'BIB' },
]

export function RouteDemoScreen({
  originNodeId,
  destinationSpaceId,
  onOriginChange,
  onDestinationChange,
}: {
  originNodeId: NodeId
  destinationSpaceId: SpaceId | null
  onOriginChange: (nodeId: NodeId) => void
  onDestinationChange: (spaceId: SpaceId | null) => void
}) {
  const [campusChoice, setCampusChoice] = useState<'calle100' | 'demo'>('calle100')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<number>(1)
  const spaceEdits = useContentStore((state) => state.spaceEdits)
  const mapEdits = useContentStore((state) => state.mapEdits)
  const { prefs } = usePreferences()
  const routeRef = useRef<HTMLElement | null>(null)

  // Phase 3: the map editor's overlay is part of the campus from here down, so
  // the router, the drawn plan and the QR selector all agree on the same data.
  const activeCampus = useMemo(
    () =>
      campusChoice === 'calle100'
        ? applyMapEdits(calle100Campus, mapEdits)
        : applyMapEdits(demoCampus, mapEdits),
    [campusChoice, mapEdits],
  )
  const activeCatalog = campusChoice === 'calle100' ? calle100Catalog : demoCatalog
  const activeBuilding = campusChoice === 'calle100' ? calle100Building : demoBuilding

  const graphIndex = useMemo(() => buildGraphIndex(activeCampus), [activeCampus])
  const floors = useMemo(() => sortedFloors(activeCampus), [activeCampus])
  const qrPoints = useMemo(() => buildQrPoints(floors), [floors])
  const presets = campusChoice === 'calle100' ? CALLE100_PRESETS : DEMO_PRESETS

  const activeOriginId = useMemo(() => {
    if (graphIndex.nodes.has(originNodeId)) return originNodeId
    return campusChoice === 'calle100' ? 'c100-p1.ent-d' : 'p1.ent'
  }, [graphIndex, originNodeId, campusChoice])

  const hits = searchDestinations(
    mergedCatalog(activeCatalog, campusChoice === 'demo' ? spaceEdits : {}),
    query,
    {
      buildingId: activeBuilding.id,
      limit: 6,
    },
  )

  const destinationSpace = destinationSpaceId ? findSpace(destinationSpaceId, activeCampus) : null

  const findPointForNode = (nodeId: NodeId): { level: number; point: LocalPoint } | null => {
    for (const floor of floors) {
      const node = floor.nodes.find((candidate) => candidate.id === nodeId)
      if (node) return { level: floor.level, point: node.point }
    }
    return null
  }

  const originPoint = findPointForNode(activeOriginId)

  const destinationAnchor = destinationSpace
    ? findPointForNode(destinationSpace.anchorNodeId)
    : null

  const result = destinationSpace
    ? computeRoute(
        graphIndex,
        { originNodeId: activeOriginId, destinationNodeId: destinationSpace.anchorNodeId },
        { destinationName: destinationSpace.name },
      )
    : null

  const route: Route | null = result?.ok ? result.route : null

  const currentFloor = floors.find((floor) => floor.level === level) ?? floors[0]

  const revealRoute = (): void => {
    requestAnimationFrame(() => {
      routeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const applyPreset = (preset: Preset): void => {
    onOriginChange(preset.origin)
    onDestinationChange(preset.destination)
    setQuery('')
    const origin = qrPoints.find((point) => point.nodeId === preset.origin)
    if (origin) setLevel(origin.level)
    revealRoute()
  }

  const chooseDestination = (spaceId: SpaceId, spaceLevel: number): void => {
    onDestinationChange(spaceId)
    setQuery('')
    setLevel(spaceLevel)
    revealRoute()
  }

  return (
    <>
      <section className="card card--brand">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <p className="card__eyebrow" style={{ margin: 0 }}>
            {campusChoice === 'calle100' ? 'Mapa Real · UMNG Calle 100' : 'Fase 1 · Motor de ruteo'}
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`chip ${campusChoice === 'calle100' ? 'chip--active' : 'chip--muted'}`}
              style={{ fontSize: '0.78rem', padding: '3px 8px' }}
              onClick={() => {
                setCampusChoice('calle100')
                onOriginChange('c100-p1.ent-d')
                onDestinationChange('AULA-E101')
                setLevel(1)
              }}
            >
              UMNG Piso 1 (Real)
            </button>
            <button
              type="button"
              className={`chip ${campusChoice === 'demo' ? 'chip--active' : 'chip--muted'}`}
              style={{ fontSize: '0.78rem', padding: '3px 8px' }}
              onClick={() => {
                setCampusChoice('demo')
                onOriginChange('p1.ent')
                onDestinationChange('A104')
                setLevel(1)
              }}
            >
              Demo Multipiso
            </button>
          </div>
        </div>

        <h1 className="card__title">
          {campusChoice === 'calle100' ? 'Navegación Piso 1 Real' : 'Probá la navegación'}
        </h1>
        <p className="card__body">
          {campusChoice === 'calle100'
            ? 'Primer piso de la UMNG digitalizado según planos: Bloques A, B, C, D y Bloque E unificados. 50 espacios navegables y 5 accesos principales.'
            : 'Edificio de demostración con medidas genéricas (40 × 24 m). Elegí dónde estás y a dónde vas.'}
        </p>
        <div className="pill-row">
          <span className="pill pill--brand">
            Dijkstra {campusChoice === 'calle100' ? 'Piso 1' : 'multipiso'}
          </span>
          <span className="pill pill--brand">{activeCampus.floors[0]?.spaces.length} espacios</span>
          <span className="pill pill--brand">{graphIndex.nodes.size} nodos</span>
        </div>
      </section>

      <section className="card">
        <p className="card__eyebrow">
          Rutas de ejemplo ({campusChoice === 'calle100' ? 'Piso 1 Real' : 'Demo'})
        </p>
        <div className="preset-row">
          {presets.map((preset) => (
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
            value={activeOriginId}
            onChange={(event) => {
              const nextId = event.target.value
              onOriginChange(nextId)
              const point = qrPoints.find((candidate) => candidate.nodeId === nextId)
              if (point) setLevel(point.level)
            }}
          >
            {qrPoints.map((point) => (
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

      {/* Verification Card with "Estoy en" and "Quiero ir a" clearly visible above the map */}
      <section
        className="card"
        style={{
          borderLeft: '4px solid var(--color-brand)',
          padding: '14px 16px',
        }}
      >
        <p className="card__eyebrow" style={{ marginBottom: '8px' }}>
          Puntos de navegación seleccionados
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--color-surface-sunken)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-ink-100)',
            }}
          >
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📍</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--color-ink-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Estoy en
              </div>
              <strong
                style={{
                  display: 'block',
                  fontSize: '0.94rem',
                  color: 'var(--color-ink-900)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={
                  qrPoints.find((candidate) => candidate.nodeId === activeOriginId)
                    ? `${qrPoints.find((candidate) => candidate.nodeId === activeOriginId)!.floorLabel} · ${qrPoints.find((candidate) => candidate.nodeId === activeOriginId)!.label}`
                    : activeOriginId
                }
              >
                {qrPoints.find((candidate) => candidate.nodeId === activeOriginId)
                  ? `${qrPoints.find((candidate) => candidate.nodeId === activeOriginId)!.floorLabel} · ${qrPoints.find((candidate) => candidate.nodeId === activeOriginId)!.label}`
                  : activeOriginId}
              </strong>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--color-surface-sunken)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-ink-100)',
            }}
          >
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🎯</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--color-ink-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Quiero ir a
              </div>
              <strong
                style={{
                  display: 'block',
                  fontSize: '0.94rem',
                  color: destinationSpace ? 'var(--color-brand)' : 'var(--color-ink-500)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={
                  destinationSpace
                    ? `${floors.find((f) => f.spaces.some((s) => s.id === destinationSpace.id))?.levelShort ?? ''} · ${destinationSpace.name} (${destinationSpace.id})`
                    : 'Ningún destino seleccionado'
                }
              >
                {destinationSpace
                  ? `${floors.find((f) => f.spaces.some((s) => s.id === destinationSpace.id))?.levelShort ?? ''} · ${destinationSpace.name} (${destinationSpace.id})`
                  : 'Ningún destino seleccionado (buscá arriba o tocá un ejemplo)'}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="card" ref={routeRef}>
        {route ? (
          <div className="summary" style={{ marginBottom: '16px' }} aria-live="polite">
            <div className="summary__item">
              <span className="summary__value">{Math.round(route.totalMeters)} m</span>
              <span className="summary__label">distancia</span>
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
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <p className="card__eyebrow" style={{ margin: 0 }}>
                Explorador de Mapa
              </p>
              <h2 className="card__title" style={{ fontSize: '1.1rem', margin: 0 }}>
                {currentFloor ? currentFloor.levelLabel : 'Plano del edificio'}
              </h2>
            </div>
            <span className="pill pill--brand">
              {currentFloor ? `${currentFloor.spaces.length} espacios` : ''}
            </span>
          </div>
        )}

        <div className="floor-chips" role="tablist" aria-label="Seleccionar piso">
          {floors.map((floor) => {
            const inRoute = route ? route.levelsVisited.includes(floor.level) : false
            return (
              <button
                key={floor.id}
                type="button"
                role="tab"
                aria-selected={floor.level === level}
                className={`chip${floor.level === level ? ' chip--active' : ''}${
                  route && !inRoute ? ' chip--muted' : ''
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
            key={currentFloor.id}
            floor={currentFloor}
            route={route}
            origin={originPoint}
            destination={destinationAnchor}
            highlightSpaceId={destinationSpace?.id ?? null}
            description={`Plano del ${currentFloor.levelLabel}${route ? ' con la ruta calculada' : ''}`}
          />
        ) : null}

        {route && !route.levelsVisited.includes(level) ? (
          <p className="muted" style={{ marginTop: '8px' }}>
            La ruta no pasa por el {currentFloor?.levelLabel}. Usá los pisos marcados con punto.
          </p>
        ) : null}

        {route ? (
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
                      <span className="step__text">
                        {prefs.locale === 'en' ? step.instructionEn : step.instruction}
                      </span>
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
        ) : null}
      </section>
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
