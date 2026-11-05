import { describe, expect, it } from 'vitest'
import { demoCatalog } from '@/data'
import { levenshtein, normalize, scoreEntry, searchDestinations } from './search'

describe('normalize', () => {
  it('strips accents so "Física" and "fisica" match', () => {
    expect(normalize('Física')).toBe('fisica')
    expect(normalize('FÍSICA')).toBe('fisica')
  })

  it('lowercases and collapses whitespace', () => {
    expect(normalize('  Aula   101  ')).toBe('aula 101')
  })

  it('removes punctuation that users type anyway', () => {
    expect(normalize('Lab. Física (2º piso)')).toBe('lab fisica 2 piso')
  })
})

describe('levenshtein', () => {
  it('is zero for equal strings', () => {
    expect(levenshtein('aula', 'aula')).toBe(0)
  })

  it('counts a single substitution', () => {
    expect(levenshtein('aula', 'aula'.replace('l', 'r'))).toBe(1)
  })

  it('bails out past the max distance', () => {
    expect(levenshtein('biblioteca', 'xyz', 2)).toBeGreaterThan(2)
  })
})

describe('scoreEntry', () => {
  it('gives exact matches the highest score', () => {
    const biblioteca = demoCatalog.find((entry) => entry.id === 'BIB')!
    expect(scoreEntry(biblioteca, 'biblioteca')).toBe(100)
  })

  it('scores a prefix match highly', () => {
    const lab = demoCatalog.find((entry) => entry.id === 'LABFIS')!
    expect(scoreEntry(lab, 'lab')).toBeGreaterThanOrEqual(70)
  })

  it('returns 0 for unrelated text', () => {
    const lab = demoCatalog.find((entry) => entry.id === 'LABFIS')!
    expect(scoreEntry(lab, 'zzzzzz')).toBe(0)
  })
})

describe('searchDestinations', () => {
  const ids = (query: string) => searchDestinations(demoCatalog, query).map((hit) => hit.entry.id)

  it('finds a classroom by its code', () => {
    expect(ids('A101')).toContain('A101')
  })

  it('finds by name without accents', () => {
    expect(ids('cafeteria')).toContain('CAFE')
  })

  it('finds by name with accents', () => {
    expect(ids('Cafetería')).toContain('CAFE')
  })

  it('matches the abbreviation students actually type', () => {
    expect(ids('lab fisica')).toContain('LABFIS')
  })

  it('matches a keyword, not just the name', () => {
    // "hemeroteca" only exists as a keyword of the library.
    expect(ids('hemeroteca')).toContain('BIB')
  })

  it('tolerates a typo', () => {
    expect(ids('bilioteca')).toContain('BIB')
  })

  it('returns an empty list for nonsense', () => {
    expect(ids('zzzzzzzz')).toHaveLength(0)
  })

  it('filters by floor', () => {
    const hits = searchDestinations(demoCatalog, 'aula', { floorId: 'edificio-demo-p2' })
    expect(hits.length).toBeGreaterThan(0)
    for (const hit of hits) expect(hit.entry.floorId).toBe('edificio-demo-p2')
  })

  it('filters by kind', () => {
    const hits = searchDestinations(demoCatalog, '', { kinds: ['bathroom'] })
    expect(hits.length).toBe(2)
    for (const hit of hits) expect(hit.entry.kind).toBe('bathroom')
  })

  it('respects the limit', () => {
    expect(searchDestinations(demoCatalog, 'aula', { limit: 2 })).toHaveLength(2)
  })

  it('returns everything active when the limit is raised', () => {
    expect(searchDestinations(demoCatalog, '', { limit: 100 })).toHaveLength(demoCatalog.length)
  })
})
