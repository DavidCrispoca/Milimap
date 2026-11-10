import { describe, expect, it } from 'vitest'
import { destinationLink, hashFor, parseHash } from './router'

describe('router parseHash', () => {
  it('maps empty and root to home', () => {
    expect(parseHash('')).toEqual({ name: 'home' })
    expect(parseHash('#/')).toEqual({ name: 'home' })
  })

  it('maps the named tabs', () => {
    expect(parseHash('#/mapa')).toEqual({ name: 'map' })
    expect(parseHash('#/escanear')).toEqual({ name: 'scan' })
    expect(parseHash('#/horario')).toEqual({ name: 'schedule' })
  })

  it('accepts English aliases', () => {
    expect(parseHash('#/map')).toEqual({ name: 'map' })
    expect(parseHash('#/scan')).toEqual({ name: 'scan' })
    expect(parseHash('#/schedule')).toEqual({ name: 'schedule' })
  })

  it('parses a destination deep link', () => {
    expect(parseHash('#/destino/A104')).toEqual({ name: 'destination', spaceId: 'A104' })
  })

  it('parses a route deep link', () => {
    expect(parseHash('#/ruta/p1.ent/A104')).toEqual({
      name: 'route',
      origin: 'p1.ent',
      destination: 'A104',
    })
  })

  it('decodes a QR payload with URL-encoded separators', () => {
    const result = parseHash('#/qr/MILIMAP%3Av1%3AEDIFICIO-DEMO%3AP1%3AN03')
    expect(result).toEqual({ name: 'qr', payload: 'MILIMAP:v1:EDIFICIO-DEMO:P1:N03' })
  })

  it('falls back to home on unknown or incomplete routes', () => {
    expect(parseHash('#/nada')).toEqual({ name: 'home' })
    expect(parseHash('#/ruta/only-origin')).toEqual({ name: 'home' })
  })
})

describe('router hashFor', () => {
  it('round-trips a route to a hash and back', () => {
    const route = { name: 'route' as const, origin: 'p1.ent', destination: 'A104' }
    expect(parseHash(hashFor(route))).toEqual(route)
  })

  it('builds a shareable destination link', () => {
    expect(destinationLink('A104')).toBe('#/destino/A104')
  })
})
