/**
 * Interactive SVG floor plan renderer with zoom and pan.
 *
 * Provides fluid pan (drag to navigate) and zoom (buttons, wheel, pinch)
 * so users can inspect details rather than being stuck on a global overview.
 */

import { useRef, useState } from 'react'
import type { Floor, LocalPoint, Route, SpaceKind } from '@/domain/types'
import { routePolylineForLevel, shortLabel, spaceCentre } from './floorPlanGeometry'

const PADDING = 1

/** Fill colour per space kind. Values come from design tokens. */
const SPACE_FILL: Record<SpaceKind, string> = {
  classroom: 'var(--map-space-classroom)',
  laboratory: 'var(--map-space-laboratory)',
  office: 'var(--map-space-office)',
  bathroom: 'var(--map-space-bathroom)',
  common: 'var(--map-space-common)',
  auditorium: 'var(--map-space-auditorium)',
  gym: 'var(--map-space-gym)',
  kitchen: 'var(--map-space-kitchen)',
  service: 'var(--map-space-service)',
}

export interface FloorPlanSvgProps {
  floor: Floor
  route?: Route | null
  /** Origin marker, only drawn on the floor it belongs to. */
  origin?: { level: number; point: LocalPoint } | null
  /** Destination marker, only drawn on the floor it belongs to. */
  destination?: { level: number; point: LocalPoint } | null
  /** Space to outline as the target. */
  highlightSpaceId?: string | null
  /** Accessible description for screen readers. */
  description?: string
  /** Whether to render the zoom and pan controls overlay. */
  enableControls?: boolean
}

export function FloorPlanSvg({
  floor,
  route,
  origin,
  destination,
  highlightSpaceId,
  description,
  enableControls = true,
}: FloorPlanSvgProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const [minX, minY, maxX, maxY] = floor.bounds
  const width = maxX - minX + PADDING * 2
  const height = maxY - minY + PADDING * 2

  // Flip the y axis: our data is "y grows north", SVG is "y grows down".
  const toSvg = (point: LocalPoint): { x: number; y: number } => ({
    x: point.x - minX + PADDING,
    y: maxY - point.y + PADDING,
  })

  const polygonPoints = (points: readonly LocalPoint[]): string =>
    points
      .map((point) => {
        const p = toSvg(point)
        return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
      })
      .join(' ')

  const routePoints = routePolylineForLevel(route, floor.level)
  const routePath = routePoints.map((point) => toSvg(point))
  const routeString = routePath.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!isDragging || !dragStartRef.current) return
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setIsDragging(false)
    dragStartRef.current = null
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.15 : 0.87
    setZoom((prev) => Math.min(Math.max(Number((prev * factor).toFixed(2)), 0.7), 5))
  }

  const handleZoomIn = (): void => {
    setZoom((prev) => Math.min(Number((prev * 1.3).toFixed(2)), 5))
  }

  const handleZoomOut = (): void => {
    setZoom((prev) => Math.max(Number((prev / 1.3).toFixed(2)), 0.7))
  }

  const handleReset = (): void => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div
      className="floor-plan-viewport"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        minHeight: '360px',
        maxHeight: '68vh',
        background: 'var(--color-surface-sunken)',
        border: '1px solid var(--color-ink-100)',
        borderRadius: 'var(--radius-md)',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Floating Controls Overlay */}
      {enableControls && (
        <div
          className="floor-plan-controls"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(4px)',
            border: '1px solid var(--color-ink-200)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            title="Acercar mapa (+)"
            aria-label="Acercar mapa"
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '18px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-ink-900)',
            }}
          >
            +
          </button>
          <div
            style={{
              fontSize: '10px',
              textAlign: 'center',
              fontWeight: 600,
              color: 'var(--color-ink-600)',
              padding: '1px 0',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(zoom * 100)}%
          </div>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Alejar mapa (-)"
            aria-label="Alejar mapa"
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '18px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-ink-900)',
            }}
          >
            −
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Restablecer vista centrada"
            aria-label="Restablecer vista"
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-ink-900)',
            }}
          >
            ↺
          </button>
        </div>
      )}

      {/* Touch and navigation guide pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '10px',
          zIndex: 5,
          fontSize: '0.72rem',
          color: 'var(--color-ink-500)',
          background: 'rgba(255, 255, 255, 0.88)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-ink-100)',
          pointerEvents: 'none',
        }}
      >
        Arrastrá para navegar · Rueda o botones para zoom
      </div>

      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.12s ease-out',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          willChange: 'transform',
        }}
      >
        <svg
          className="floor-plan"
          viewBox={`0 0 ${width.toFixed(2)} ${height.toFixed(2)}`}
          role="img"
          aria-label={description ?? `Plano del ${floor.levelLabel}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {/* Walkable surface */}
          {floor.walkways.map((walkway) => (
            <polygon
              key={walkway.id}
              points={polygonPoints(walkway.polygon)}
              fill="var(--map-walkway)"
              stroke="var(--color-ink-300)"
              strokeWidth={0.08}
            />
          ))}

          {/* Rooms and facilities */}
          {floor.spaces.map((space) => {
            const isTarget = space.id === highlightSpaceId
            return (
              <g key={space.id}>
                <polygon
                  points={polygonPoints(space.polygon)}
                  fill={SPACE_FILL[space.kind]}
                  stroke={isTarget ? 'var(--map-destination)' : 'var(--color-ink-300)'}
                  strokeWidth={isTarget ? 0.22 : 0.08}
                />
                <text
                  x={toSvg(spaceCentre(space.polygon)).x}
                  y={toSvg(spaceCentre(space.polygon)).y}
                  className="floor-plan__label"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {shortLabel(space.name)}
                </text>
              </g>
            )
          })}

          {/* Vertical cores (stairs & elevators) */}
          {floor.nodes
            .filter((node) => node.kind === 'stair' || node.kind === 'elevator')
            .map((node) => {
              const p = toSvg(node.point)
              return (
                <g key={node.id}>
                  <circle cx={p.x} cy={p.y} r={0.55} fill="var(--color-ink-700)" opacity={0.85} />
                  <text
                    x={p.x}
                    y={p.y}
                    className="floor-plan__core-label"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {node.kind === 'stair' ? 'E' : 'A'}
                  </text>
                </g>
              )
            })}

          {/* Route path */}
          {routeString ? (
            <>
              <polyline
                points={routeString}
                fill="none"
                stroke="#ffffff"
                strokeWidth={0.85}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={routeString}
                fill="none"
                stroke="var(--map-route)"
                strokeWidth={0.45}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : null}

          {/* Origin Marker */}
          {origin && origin.level === floor.level ? (
            <g>
              <circle
                cx={toSvg(origin.point).x}
                cy={toSvg(origin.point).y}
                r={0.8}
                fill="var(--map-origin)"
                stroke="#fff"
                strokeWidth={0.18}
              />
            </g>
          ) : null}

          {/* Destination Marker */}
          {destination && destination.level === floor.level ? (
            <g>
              <circle
                cx={toSvg(destination.point).x}
                cy={toSvg(destination.point).y}
                r={0.8}
                fill="var(--map-destination)"
                stroke="#fff"
                strokeWidth={0.18}
              />
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  )
}
