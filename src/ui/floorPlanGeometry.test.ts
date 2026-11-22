import { describe, expect, it } from 'vitest'
import type { LocalPoint } from '@/domain/types'
import { spaceLabelLayout } from './floorPlanGeometry'

function rect(x1: number, y1: number, x2: number, y2: number): LocalPoint[] {
  return [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
  ]
}

/** Remove the hyphenation inserted by the wrapper so names can be compared. */
function flatten(lines: readonly { text: string }[]): string {
  return lines
    .map((line) => line.text)
    .join(' ')
    .replace(/-\s+/g, '')
}

describe('spaceLabelLayout', () => {
  it('keeps a short name whole on one line at the base font size', () => {
    const lines = spaceLabelLayout('Aula 101', rect(0, 0, 14, 8))

    expect(lines.map((line) => line.text)).toEqual(['Aula 101'])
    expect(lines[0]!.fontSize).toBe(2.1)
    expect(lines[0]!.textLength).toBeUndefined()
  })

  it('wraps long names into several lines without truncating them', () => {
    const name = 'Departamento de Matemáticas'
    const lines = spaceLabelLayout(name, rect(0, 0, 5, 10))

    expect(lines.length).toBeGreaterThan(1)
    expect(flatten(lines)).toBe(name)
    expect(lines.every((line) => !line.text.includes('…'))).toBe(true)
    expect(lines.every((line) => line.textLength === undefined)).toBe(true)
  })

  it('squeezes every line only when a very long name cannot fit a narrow room', () => {
    const name = 'Departamento de Tecnologías del Conocimiento DEPTEC'
    const lines = spaceLabelLayout(name, rect(0, 0, 3, 4))

    expect(lines.some((line) => line.textLength !== undefined)).toBe(true)
    expect(lines.every((line) => line.textLength === undefined || line.textLength <= 2.5)).toBe(
      true,
    )
    expect(flatten(lines)).toBe(name)
  })

  it('returns no lines for an empty polygon', () => {
    expect(spaceLabelLayout('Aula', [])).toEqual([])
  })
})
