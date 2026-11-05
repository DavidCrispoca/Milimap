/**
 * QR payload encoding.
 *
 * Wire format (kept deliberately short so the printed code stays low-density and
 * scans from a distance):
 *
 *     MILIMAP:v1:<buildingKey>:<floorKey>:<nodeKey>
 *
 * The payload points at a GRAPH NODE, never at raw coordinates. If a node is
 * nudged, the JSON changes and every sticker already glued to a wall keeps
 * working. Coordinates would force reprinting the whole campus.
 */

import type { Building, Floor, NodeId, QrParseResult, QrPayload } from './types'

export const QR_MAGIC = 'MILIMAP'
export const QR_VERSION = 1
export const QR_SEPARATOR = ':'

/** Encode a payload. Values are written verbatim; matching is case-insensitive. */
export function serializeQr(payload: QrPayload): string {
  return [
    QR_MAGIC,
    `v${payload.version}`,
    payload.buildingId,
    payload.floorKey,
    payload.nodeKey,
  ].join(QR_SEPARATOR)
}

/**
 * Parse user input into a payload.
 *
 * Tolerates surrounding whitespace and a leading URL form
 * (`https://host/#/qr/MILIMAP:v1:...`) because some scanners hand over the full
 * URL instead of the raw text.
 */
export function parseQr(raw: string): QrParseResult {
  const text = raw.trim()
  if (!text) return { ok: false, code: 'MALFORMED' }

  // Match the magic AND the version prefix together. Matching only "MILIMAP"
  // would wrongly trigger on a hostname such as `milimap.example/#/qr/...`.
  const match = /MILIMAP:v\d+:/i.exec(text)
  if (!match) {
    return {
      ok: false,
      code: text.toUpperCase().includes(QR_MAGIC) ? 'MALFORMED' : 'NOT_MILIMAP',
    }
  }

  const candidate = text.slice(match.index)
  const parts = candidate.split(QR_SEPARATOR)

  if (parts.length !== 5) return { ok: false, code: 'MALFORMED' }

  const [magic, versionPart, buildingId, floorKey, nodeKey] = parts
  if (!magic || magic.toUpperCase() !== QR_MAGIC) return { ok: false, code: 'NOT_MILIMAP' }
  if (!versionPart || !buildingId || !floorKey || !nodeKey) return { ok: false, code: 'MALFORMED' }

  const versionMatch = /^v(\d+)$/i.exec(versionPart)
  if (!versionMatch) return { ok: false, code: 'MALFORMED' }

  const version = Number(versionMatch[1])
  if (version !== QR_VERSION) return { ok: false, code: 'UNSUPPORTED_VERSION' }

  return {
    ok: true,
    payload: {
      version: QR_VERSION,
      buildingId,
      floorKey,
      nodeKey,
    },
  }
}

/**
 * Map a payload to a concrete node.
 *
 * Resolution is case-insensitive and uses `GraphNode.qrKey`, which is the stable
 * printed identifier. Node ids are internal and may change with refactors; the
 * sticker on the wall must not.
 */
export function resolveQrNode(
  building: Building,
  floors: readonly Floor[],
  payload: QrPayload,
): NodeId | null {
  if (building.id.toLowerCase() !== payload.buildingId.toLowerCase()) return null

  const floorKey = payload.floorKey.toLowerCase()
  const candidateFloors = floors.filter(
    (floor) =>
      floor.buildingId === building.id &&
      (floor.levelShort.toLowerCase() === floorKey || floor.id.toLowerCase() === floorKey),
  )

  const nodeKey = payload.nodeKey.toLowerCase()
  for (const floor of candidateFloors) {
    for (const node of floor.nodes) {
      if (node.qrKey && node.qrKey.toLowerCase() === nodeKey) return node.id
      if (node.id.toLowerCase() === nodeKey) return node.id
    }
  }

  return null
}
