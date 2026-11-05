import { describe, expect, it } from 'vitest'
import { demoBuilding, demoFloors } from '@/data'
import { parseQr, resolveQrNode, serializeQr } from './qr'

describe('serializeQr', () => {
  it('produces the documented wire format', () => {
    expect(
      serializeQr({
        version: 1,
        buildingId: 'edificio-demo',
        floorKey: 'P1',
        nodeKey: 'N10',
      }),
    ).toBe('MILIMAP:v1:edificio-demo:P1:N10')
  })
})

describe('parseQr', () => {
  it('round-trips a serialized payload', () => {
    const original = {
      version: 1 as const,
      buildingId: 'edificio-demo',
      floorKey: 'P2',
      nodeKey: 'N01',
    }
    expect(parseQr(serializeQr(original))).toEqual({ ok: true, payload: original })
  })

  it('rejects text that is not a Milimap code', () => {
    expect(parseQr('https://example.com')).toEqual({ ok: false, code: 'NOT_MILIMAP' })
  })

  it('accepts a URL wrapper around the payload', () => {
    const result = parseQr('https://milimap.example/#/qr/MILIMAP:v1:edificio-demo:P1:N10')
    expect(result.ok).toBe(true)
  })

  it('tolerates surrounding whitespace', () => {
    expect(parseQr('  MILIMAP:v1:edificio-demo:P1:N10  ').ok).toBe(true)
  })

  it('rejects an unsupported version instead of guessing', () => {
    expect(parseQr('MILIMAP:v9:edificio-demo:P1:N10')).toEqual({
      ok: false,
      code: 'UNSUPPORTED_VERSION',
    })
  })

  it('rejects a truncated payload', () => {
    expect(parseQr('MILIMAP:v1:edificio-demo:P1')).toEqual({ ok: false, code: 'MALFORMED' })
  })

  it('rejects a payload with an empty part', () => {
    expect(parseQr('MILIMAP:v1::P1:N10')).toEqual({ ok: false, code: 'MALFORMED' })
  })
})

describe('resolveQrNode', () => {
  const payload = {
    version: 1 as const,
    buildingId: 'edificio-demo',
    floorKey: 'P2',
    nodeKey: 'N01',
  }

  it('resolves a stub to the stair node on the requested floor', () => {
    expect(resolveQrNode(demoBuilding, demoFloors, payload)).toBe('p2.st1')
  })

  it('resolves the same key on the other floor to that floor node', () => {
    expect(resolveQrNode(demoBuilding, demoFloors, { ...payload, floorKey: 'P1' })).toBe('p1.st1')
  })

  it('is case-insensitive on every part', () => {
    expect(
      resolveQrNode(demoBuilding, demoFloors, {
        ...payload,
        buildingId: 'EDIFICIO-DEMO',
        floorKey: 'p2',
        nodeKey: 'n01',
      }),
    ).toBe('p2.st1')
  })

  it('returns null for a building that is not ours', () => {
    expect(resolveQrNode(demoBuilding, demoFloors, { ...payload, buildingId: 'otro' })).toBeNull()
  })

  it('returns null for an unknown node key', () => {
    expect(resolveQrNode(demoBuilding, demoFloors, { ...payload, nodeKey: 'N99' })).toBeNull()
  })
})
