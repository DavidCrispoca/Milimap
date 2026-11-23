import { describe, expect, it } from 'vitest'
import { calle100Campus, demoCampus } from '@/data'
import { analyzeScan, describeNodeAt } from './flow'

describe('scanner/flow analyzeScan', () => {
  it('confirms a QR that points at the entrance node', () => {
    const result = analyzeScan('MILIMAP:v1:EDIFICIO-DEMO:P1:N03', demoCampus)
    expect(result.status).toBe('confirmed')
    if (result.status !== 'confirmed') return
    expect(result.nodeId).toBe('p1.ent')
    expect(result.level).toBe(1)
    expect(result.levelShort).toBe('P1')
    expect(result.label).toBe('Entrada principal')
  })

  it('confirms a QR on a room door and names the room', () => {
    const result = analyzeScan('MILIMAP:v1:edificio-demo:p1:N11', demoCampus)
    expect(result.status).toBe('confirmed')
    if (result.status !== 'confirmed') return
    expect(result.label).toBe('Aula 101')
  })

  it('is case-insensitive on the building and floor keys', () => {
    const result = analyzeScan('milimap:v1:EDIFICIO-DEMO:p1:n03', demoCampus)
    expect(result.status).toBe('confirmed')
  })

  it('reports NOT_MILIMAP for a foreign code', () => {
    const result = analyzeScan('https://example.com/some-other-qr', demoCampus)
    expect(result.status).toBe('not_milimap')
  })

  it('reports unsupported_version for a future payload', () => {
    const result = analyzeScan('MILIMAP:v99:EDIFICIO-DEMO:P1:N03', demoCampus)
    expect(result.status).toBe('unsupported_version')
  })

  it('reports malformed for a truncated payload', () => {
    const result = analyzeScan('MILIMAP:v1:EDIFICIO-DEMO', demoCampus)
    expect(result.status).toBe('malformed')
  })

  it('reports unresolved when the node key does not exist in the campus', () => {
    const result = analyzeScan('MILIMAP:v1:EDIFICIO-DEMO:P1:N99', demoCampus)
    expect(result.status).toBe('unresolved')
  })
})

describe('scanner/flow with the real Calle 100 campus', () => {
  it('resolves an entrance sticker and names which door it is', () => {
    const result = analyzeScan('MILIMAP:v1:umng-calle100:P1:QRD', calle100Campus)
    expect(result.status).toBe('confirmed')
    if (result.status !== 'confirmed') return
    expect(result.levelShort).toBe('P1')
    expect(result.label).toBe('Entrada QRD')
  })

  it('resolves a classroom door and names the room', () => {
    const result = analyzeScan('MILIMAP:v1:umng-calle100:P1:N237', calle100Campus)
    expect(result.status).toBe('confirmed')
    if (result.status !== 'confirmed') return
    expect(result.label).toBe('Aula E 101')
  })

  it('resolves a sticker on another floor', () => {
    const result = analyzeScan('MILIMAP:v1:umng-calle100:P5:ASC-E-P5', calle100Campus)
    expect(result.status).toBe('confirmed')
    if (result.status !== 'confirmed') return
    expect(result.level).toBe(5)
    expect(result.label).toBe('Ascensor P5')
  })
})

describe('scanner/flow describeNodeAt', () => {
  it('names the stair and elevator cores by floor', () => {
    expect(describeNodeAt(demoCampus, 'p1.st1')).toBe('Escalera P1')
    expect(describeNodeAt(demoCampus, 'p2.ev1')).toBe('Ascensor P2')
  })

  it('falls back to a generic label for an unknown node', () => {
    expect(describeNodeAt(demoCampus, 'does-not-exist')).toBe('Punto QR')
  })
})
