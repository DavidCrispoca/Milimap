import { describe, expect, it } from 'vitest'
import { resolveRoom, roomOptions } from './rooms'

describe('schedule/rooms', () => {
  it('only suggests teaching spaces', () => {
    const options = roomOptions()
    expect(options.length).toBeGreaterThan(0)
    expect(options.every((option) => option.kind !== 'bathroom')).toBe(true)
    expect(options.every((option) => option.kind !== 'office')).toBe(true)
  })

  it('sorts suggestions alphabetically', () => {
    const names = roomOptions().map((option) => option.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es')))
  })

  it('resolves a room by name, ignoring case and accents', () => {
    expect(resolveRoom('aula b 101')?.id).toBe('AULA-B101')
    expect(resolveRoom('AULA B 101')?.id).toBe('AULA-B101')
  })

  it('resolves a room by id and by alias', () => {
    expect(resolveRoom('AULA-B101')?.id).toBe('AULA-B101')
    expect(resolveRoom('B101')?.id).toBe('AULA-B101')
  })

  it('returns null for an unknown or empty room', () => {
    expect(resolveRoom('Salón inventado 999')).toBeNull()
    expect(resolveRoom('   ')).toBeNull()
  })
})
