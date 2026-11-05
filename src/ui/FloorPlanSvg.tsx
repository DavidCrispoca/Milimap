/**
 * Minimal SVG floor plan renderer.
 *
 * WHY SVG AND NOT MAPLIBRE YET: Phase 1 is about the routing engine. MapLibre
 * arrives in Phase 4 with pan, zoom and real geo coordinates. For verifying that
 * a route is geometrically sane, a plain SVG over local meters is better: it has
 * no projection, no tile loading, no async, and it renders exactly the numbers
 * the router produces.
 *
 * This component is intentionally dumb: it draws what it is given.
 */

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
}

export function FloorPlanSvg({
  floor,
  route,
  origin,
  destination,
  highlightSpaceId,
  description,
}: FloorPlanSvgProps) {
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

  return (
    <svg
      className="floor-plan"
      viewBox={`0 0 ${width.toFixed(2)} ${height.toFixed(2)}`}
      role="img"
      aria-label={description ?? `Plano del ${floor.levelLabel}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Walkable surface first, so it sits under the rooms. */}
      {floor.walkways.map((walkway) => (
        <polygon
          key={walkway.id}
          points={polygonPoints(walkway.polygon)}
          fill="var(--map-walkway)"
          stroke="var(--color-ink-300)"
          strokeWidth={0.08}
        />
      ))}

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

      {/* Vertical cores, drawn as small markers so they are findable. */}
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

      {origin && origin.level === floor.level ? (
        <g>
          <circle
            cx={toSvg(origin.point).x}
            cy={toSvg(origin.point).y}
            r={0.75}
            fill="var(--map-origin)"
            stroke="#fff"
            strokeWidth={0.15}
          />
        </g>
      ) : null}

      {destination && destination.level === floor.level ? (
        <g>
          <circle
            cx={toSvg(destination.point).x}
            cy={toSvg(destination.point).y}
            r={0.75}
            fill="var(--map-destination)"
            stroke="#fff"
            strokeWidth={0.15}
          />
        </g>
      ) : null}
    </svg>
  )
}
