/**
 * Catalog view with administrator edits applied.
 *
 * The base catalog comes from the map data (demo now, real campus later). Admin
 * edits (renamed rooms, extra aliases, deactivated rooms) are an overlay, so the
 * geometry never has to change to fix a name or hide a room.
 */

import type { CatalogEntry } from '@/domain/types'
import type { SpaceEdit } from './types'

export function mergedCatalog(
  base: readonly CatalogEntry[],
  edits: Readonly<Record<string, SpaceEdit | undefined>>,
): CatalogEntry[] {
  return base.map((entry) => {
    const edit = edits[entry.id]
    if (!edit) return entry
    return {
      ...entry,
      ...(edit.name === undefined ? {} : { name: edit.name }),
      ...(edit.aliases === undefined ? {} : { aliases: edit.aliases }),
      ...(edit.kind === undefined ? {} : { kind: edit.kind }),
      ...(edit.active === undefined ? {} : { active: edit.active }),
    }
  })
}
