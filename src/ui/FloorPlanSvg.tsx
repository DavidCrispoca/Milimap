/**
 * Interactive SVG floor plan renderer with zoom and pan.
 *
 * Provides fluid pan (drag to navigate) and zoom (buttons, wheel, pinch)
 * so users can inspect details rather than being stuck on a global overview.
 * Panning is clamped to the visible content (plus a small slack) so the floor
 * plan can never be dragged out of view; the "Centrar" control restores the
 * initial centred view at 100% zoom.
 */

import { useEffect, useRef, useState } from 'react'
import type { Floor, LocalPoint, Route, SpaceKind } from '@/domain/types'
import { routePolylineForLevel, shortLabel, spaceCentre } from './floorPlanGeometry'

const PADDING = 1

/** Pan slack as a fraction of the viewport, even when no zoom overflow exists. */
const PAN_SLACK = 0.12

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function computePanLimits(viewport: HTMLElement, content: HTMLElement, zoom: number) {
  const vw = viewport.clientWidth
  const vh = viewport.clientHeight
  const cw = content.offsetWidth
  const ch = content.offsetHeight
  return {
    x: Math.max(0, (cw * zoom - vw) / 2) + vw * PAN_SLACK,
    y: Math.max(0, (ch * zoom - vh) / 2) + vh * PAN_SLACK,
  }
}

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
  const [panLimits, setPanLimits] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const zoomRef = useRef(1)

  // Derived so shrinking limits (zoom out / floor change) never leave the plan
  // stranded off-screen, without an extra state update in an effect.
  const visiblePan = {
    x: clamp(pan.x, -panLimits.x, panLimits.x),
    y: clamp(pan.y, -panLimits.y, panLimits.y),
  }

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

  // Allow dragging only as far as the scaled content overflows the viewport,
  // plus a little slack so the map still feels draggable at 100% zoom.
  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const recompute = (): void => {
      setPanLimits(computePanLimits(viewport, content, zoom))
    }

    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(viewport)
    observer.observe(content)
    return () => observer.disconnect()
  }, [zoom, floor.id])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - visiblePan.x,
      y: e.clientY - visiblePan.y,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!isDragging || !dragStartRef.current) return
    setPan({
      x: clamp(e.clientX - dragStartRef.current.x, -panLimits.x, panLimits.x),
      y: clamp(e.clientY - dragStartRef.current.y, -panLimits.y, panLimits.y),
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setIsDragging(false)
    dragStartRef.current = null
  }

  /** Zoom from an interaction, clamping the stored pan to the new limits. */
  const applyZoom = (nextZoom: number): void => {
    const next = clamp(Number(nextZoom.toFixed(2)), 0.7, 5)
    zoomRef.current = next
    setZoom(next)

    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return
    const limits = computePanLimits(viewport, content, next)
    setPan((current) => ({
      x: clamp(current.x, -limits.x, limits.x),
      y: clamp(current.y, -limits.y, limits.y),
    }))
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    e.preventDefault()
    applyZoom(zoomRef.current * (e.deltaY < 0 ? 1.15 : 0.87))
  }

  const handleZoomIn = (): void => applyZoom(zoomRef.current * 1.3)

  const handleZoomOut = (): void => applyZoom(zoomRef.current / 1.3)

  const handleReset = (): void => {
    setIsDragging(false)
    dragStartRef.current = null
    zoomRef.current = 1
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div
      ref={viewportRef}
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
            alignItems: 'center',
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
          <div style={{ width: 24, height: 1, background: 'var(--color-ink-200)' }} />
          <button
            type="button"
            onClick={handleReset}
            title="Volver al centro del mapa"
            aria-label="Volver al centro del mapa"
            style={{
              width: '44px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1px',
              padding: '4px 0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-brand)',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>⌖</span>
            <span style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1 }}>Centrar</span>
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
        Arrastrá para navegar · Rueda para zoom · ⌖ para centrar
      </div>

      <div
        ref={contentRef}
        style={{
          transform: `translate(${visiblePan.x}px, ${visiblePan.y}px) scale(${zoom})`,
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
