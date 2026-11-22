/**
 * Geometry helpers for the SVG floor plan.
 *
 * Kept out of the component file so that file exports only components, which is
 * what React Fast Refresh needs to work during development.
 */

import type { LocalPoint, Route } from '@/domain/types'

/** Collect the route polyline for one floor, de-duplicating shared joints. */
export function routePolylineForLevel(
  route: Route | null | undefined,
  level: number,
): LocalPoint[] {
  if (!route) return []

  const points: LocalPoint[] = []
  for (const step of route.steps) {
    if (step.level !== level) continue
    for (const point of step.points) {
      const previous = points[points.length - 1]
      if (previous && previous.x === point.x && previous.y === point.y) continue
      points.push(point)
    }
  }
  return points
}

/** Vertex average: good enough as a label anchor for rectangles. */
export function spaceCentre(polygon: readonly LocalPoint[]): LocalPoint {
  if (polygon.length === 0) return { x: 0, y: 0 }
  let x = 0
  let y = 0
  for (const point of polygon) {
    x += point.x
    y += point.y
  }
  return { x: x / polygon.length, y: y / polygon.length }
}

/** One rendered line of a room label, in SVG viewBox units. */
export interface LabelLine {
  text: string
  fontSize: number
  /** Present when the line must be squeezed to stay inside the room. */
  textLength?: number
}

const BASE_FONT_SIZE = 2.1
const MIN_FONT_SIZE = 1.05
const FONT_STEP = 0.05
/** Rough average glyph width as a fraction of the font size. */
const AVG_CHAR_WIDTH = 0.62
export const LABEL_LINE_HEIGHT = 1.15
const MAX_LINES = 5

/** Break overlong words at `maxChars` so no single glyph run spills out. */
function splitLongWord(word: string, maxChars: number): string[] {
  if (word.length <= maxChars) return [word]

  const parts: string[] = []
  let rest = word
  while (rest.length > maxChars) {
    parts.push(`${rest.slice(0, maxChars - 1)}-`)
    rest = rest.slice(maxChars - 1)
  }
  parts.push(rest)
  return parts
}

function wrapWords(words: readonly string[], maxChars: number): string[] {
  const chunks = words.flatMap((word) => splitLongWord(word, maxChars))
  const lines: string[] = []
  let current = ''
  for (const chunk of chunks) {
    if (!current) {
      current = chunk
    } else if (current.length + 1 + chunk.length <= maxChars) {
      current += ` ${chunk}`
    } else {
      lines.push(current)
      current = chunk
    }
  }
  if (current) lines.push(current)
  return lines
}

/** Split words into contiguous, balanced lines before squeezing them. */
function distributeWords(words: readonly string[], lineCount: number): string[] {
  const perLine = Math.ceil(words.length / lineCount)
  const lines: string[] = []
  for (let index = 0; index < words.length; index += perLine) {
    lines.push(words.slice(index, index + perLine).join(' '))
  }
  return lines
}

/**
 * Fit a room name inside its polygon without ever truncating it.
 *
 * It first tries to wrap the full name at progressively smaller font sizes.
 * Only when that is impossible (very long names in narrow rooms) it keeps every
 * word and squeezes the lines with `textLength` so nothing spills out.
 */
export function spaceLabelLayout(name: string, polygon: readonly LocalPoint[]): LabelLine[] {
  if (polygon.length === 0) return []

  const xs = polygon.map((point) => point.x)
  const ys = polygon.map((point) => point.y)
  const innerWidth = Math.max(1, Math.max(...xs) - Math.min(...xs) - 0.5)
  const innerHeight = Math.max(1, Math.max(...ys) - Math.min(...ys) - 0.4)

  const words = name.replace('Laboratorio de ', 'Lab. ').split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const steps = Math.round((BASE_FONT_SIZE - MIN_FONT_SIZE) / FONT_STEP)
  for (let step = 0; step <= steps; step += 1) {
    const fontSize = Math.round((BASE_FONT_SIZE - step * FONT_STEP) * 100) / 100
    const charsPerLine = Math.max(3, Math.floor(innerWidth / (fontSize * AVG_CHAR_WIDTH)))
    const maxLines = Math.min(MAX_LINES, Math.floor(innerHeight / (fontSize * LABEL_LINE_HEIGHT)))
    if (maxLines < 1) continue

    const lines = wrapWords(words, charsPerLine)
    if (lines.length <= maxLines) return lines.map((text) => ({ text, fontSize }))
  }

  const lineCount = Math.max(
    1,
    Math.min(MAX_LINES, Math.floor(innerHeight / (MIN_FONT_SIZE * LABEL_LINE_HEIGHT))),
  )
  return distributeWords(words, lineCount).map((text) => {
    const naturalWidth = text.length * MIN_FONT_SIZE * AVG_CHAR_WIDTH
    return naturalWidth > innerWidth
      ? { text, fontSize: MIN_FONT_SIZE, textLength: innerWidth }
      : { text, fontSize: MIN_FONT_SIZE }
  })
}
