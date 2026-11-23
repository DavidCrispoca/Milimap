/**
 * Room suggestions for the schedule form.
 *
 * The student types the room freely; this module only suggests the campus
 * spaces that make sense for a class and translates what they typed into a
 * space id, which is what "Cómo llegar" needs. A room outside the catalog is
 * not an error: the class keeps the name and simply has no route.
 */

import { calle100Catalog } from '@/data'
import type { CatalogEntry } from '@/domain/types'
import type { SpaceId, SpaceKind } from '@/domain/types'

export interface RoomOption {
  id: SpaceId
  name: string
  level: number
  kind: SpaceKind
  aliases: string[]
}

/** Spaces a class can plausibly be held in. */
const TEACHING_KINDS: readonly SpaceKind[] = ['classroom', 'laboratory', 'auditorium', 'common']

function toOption(entry: CatalogEntry): RoomOption {
  return {
    id: entry.id,
    name: entry.name,
    level: entry.level,
    kind: entry.kind,
    aliases: entry.aliases,
  }
}

/** Active teaching spaces, sorted the way a student would scan them. */
export function roomOptions(): RoomOption[] {
  return calle100Catalog
    .filter((entry) => entry.active && TEACHING_KINDS.includes(entry.kind))
    .map(toOption)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

/** Case- and accent-insensitive comparison key. */
function key(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Match what the student typed against ids, names and aliases. */
export function resolveRoom(
  value: string,
  options: readonly RoomOption[] = roomOptions(),
): RoomOption | null {
  const target = key(value)
  if (!target) return null

  return (
    options.find(
      (option) =>
        key(option.id) === target ||
        key(option.name) === target ||
        option.aliases.some((alias) => key(alias) === target),
    ) ?? null
  )
}
