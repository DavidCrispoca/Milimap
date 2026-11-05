/**
 * Destination search.
 *
 * The hard requirement is that a student types what they actually say, not what
 * the catalog says. "lab fisica" must find "Laboratorio de Física". That means
 * accent-insensitive, case-insensitive and typo-tolerant matching.
 *
 * Scoring is a plain weighted cascade instead of a full-text engine: with a few
 * hundred destinations, a linear scan with good scoring beats an index, and the
 * behaviour is trivial to reason about and to test.
 */

import type { CatalogEntry, SpaceKind } from './types'

export interface SearchOptions {
  /** Restrict to a single building. Multi-building support is Phase 3+. */
  buildingId?: string
  /** Restrict to a single floor. */
  floorId?: string
  kinds?: SpaceKind[]
  /** Include entries flagged `restricted`. Off by default. */
  includeRestricted?: boolean
  limit?: number
}

/**
 * Lowercase, strip diacritics and punctuation, collapse whitespace.
 *
 * NFD + removing combining marks is what makes "Física" and "fisica" equal.
 * This matters more in Spanish than it looks: students rarely type accents.
 */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Levenshtein distance with an early exit once `max` is exceeded. */
export function levenshtein(a: string, b: string, max = 3): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1

  const previous = new Array<number>(b.length + 1)
  const current = new Array<number>(b.length + 1)

  for (let j = 0; j <= b.length; j += 1) previous[j] = j

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i
    let rowMin = current[0] ?? 0

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const del = (previous[j] ?? 0) + 1
      const ins = (current[j - 1] ?? 0) + 1
      const sub = (previous[j - 1] ?? 0) + cost
      const value = Math.min(del, ins, sub)
      current[j] = value
      if (value < rowMin) rowMin = value
    }

    // Every remaining row can only grow: bail out when already too far.
    if (rowMin > max) return max + 1
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j] ?? 0
  }

  return previous[b.length] ?? max + 1
}

/** All the spellings that should match an entry. */
function searchableTerms(entry: CatalogEntry): string[] {
  return [entry.name, ...entry.aliases, ...entry.keywords].map(normalize).filter(Boolean)
}

/**
 * Score a single entry against an already-normalized query. 0 means no match.
 *
 * The score is only used for ordering, so the exact numbers matter less than
 * the ranking they produce.
 */
export function scoreEntry(entry: CatalogEntry, normalizedQuery: string): number {
  if (!normalizedQuery) return 1

  const query = normalizedQuery
  const tokens = query.split(' ').filter(Boolean)
  let best = 0

  for (const term of searchableTerms(entry)) {
    if (term === query) best = Math.max(best, 100)
    else if (term.startsWith(query)) best = Math.max(best, 85)
    else if (term.includes(query)) best = Math.max(best, 70)
    else {
      // Every token must appear somewhere in the term ("lab fisica").
      if (tokens.length > 1 && tokens.every((token) => term.includes(token))) {
        best = Math.max(best, 55)
      }
      // Typo tolerance, only for queries long enough to make it meaningful.
      if (query.length >= 4) {
        const maxDistance = query.length <= 6 ? 1 : 2
        const distance = levenshtein(query, term, maxDistance)
        if (distance <= maxDistance) {
          best = Math.max(best, 45 - distance * 10)
        }
      }
    }
  }

  return best
}

export interface SearchHit {
  entry: CatalogEntry
  score: number
}

/** Rank the catalog against a free-text query. */
export function searchDestinations(
  catalog: readonly CatalogEntry[],
  query: string,
  options: SearchOptions = {},
): SearchHit[] {
  const normalizedQuery = normalize(query)
  const limit = options.limit ?? 12

  const hits: SearchHit[] = []
  for (const entry of catalog) {
    if (!entry.active) continue
    if (entry.restricted && !options.includeRestricted) continue
    if (options.buildingId && entry.buildingId !== options.buildingId) continue
    if (options.floorId && entry.floorId !== options.floorId) continue
    if (options.kinds && options.kinds.length > 0 && !options.kinds.includes(entry.kind)) continue

    const score = scoreEntry(entry, normalizedQuery)
    if (score > 0) hits.push({ entry, score })
  }

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // Stable, human-friendly tiebreak: ground floor first, then alphabetical.
    if (a.entry.level !== b.entry.level) return a.entry.level - b.entry.level
    return a.entry.name.localeCompare(b.entry.name, 'es')
  })

  return hits.slice(0, limit)
}
