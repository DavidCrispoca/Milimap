/**
 * Scan flow: the pure part of the QR scanner.
 *
 * Takes a raw scanned string (from the camera or typed by hand) and decides what
 * it means for the app. Kept free of React and of the camera library so the
 * decision logic is testable in plain jsdom, and so the same rules apply whether
 * the input came from a phone camera or a desktop keyboard.
 *
 * The heavy lifting (parsing, node resolution) lives in `src/domain/qr.ts`.
 */

import { parseQr, resolveQrNode } from '@/domain/qr'
import type { Campus } from '@/domain/routing'
import type { NodeId, QrParseError, QrPayload } from '@/domain/types'

export type ScanFailureReason = 'not_milimap' | 'unsupported_version' | 'malformed' | 'unresolved'

export interface ConfirmedScan {
  status: 'confirmed'
  nodeId: NodeId
  floorId: string
  level: number
  levelShort: string
  /** Human label of where the sticker is: "Entrada principal", "Aula 101"… */
  label: string
  payload: QrPayload
}

export interface FailedScan {
  status: ScanFailureReason
  code: QrParseError
}

export interface UnresolvedScan {
  status: 'unresolved'
  payload: QrPayload
}

export type ScanResult = ConfirmedScan | FailedScan | UnresolvedScan

/** Human-readable name for a node, reused by the confirmation screen. */
export function describeNodeAt(campus: Campus, nodeId: NodeId): string {
  for (const floor of campus.floors) {
    const node = floor.nodes.find((candidate) => candidate.id === nodeId)
    if (!node) continue

    if (node.kind === 'entrance') return 'Entrada principal'
    if (node.kind === 'stair') return `Escalera ${floor.levelShort}`
    if (node.kind === 'elevator') return `Ascensor ${floor.levelShort}`

    const space = floor.spaces.find((candidate) => candidate.anchorNodeId === node.id)
    if (space) return space.name

    return `Punto ${floor.levelShort}`
  }
  return 'Punto QR'
}

/** Where the confirmed node lives (floor id / level / short label). */
function locateNode(
  campus: Campus,
  nodeId: NodeId,
): {
  floorId: string
  level: number
  levelShort: string
} | null {
  for (const floor of campus.floors) {
    if (floor.nodes.some((candidate) => candidate.id === nodeId)) {
      return { floorId: floor.id, level: floor.level, levelShort: floor.levelShort }
    }
  }
  return null
}

/**
 * Classify a scanned string against the current campus.
 *
 * Never throws: a wrong or foreign code is a normal input, not an error state.
 */
export function analyzeScan(raw: string, campus: Campus): ScanResult {
  const parsed = parseQr(raw)
  if (!parsed.ok) {
    return { status: mapParseError(parsed.code), code: parsed.code }
  }

  const nodeId = resolveQrNode(campus.building, campus.floors, parsed.payload)
  if (!nodeId) return { status: 'unresolved', payload: parsed.payload }

  const location = locateNode(campus, nodeId)
  if (!location) return { status: 'unresolved', payload: parsed.payload }

  return {
    status: 'confirmed',
    nodeId,
    ...location,
    label: describeNodeAt(campus, nodeId),
    payload: parsed.payload,
  }
}

function mapParseError(code: QrParseError): ScanFailureReason {
  switch (code) {
    case 'NOT_MILIMAP':
      return 'not_milimap'
    case 'UNSUPPORTED_VERSION':
      return 'unsupported_version'
    case 'MALFORMED':
      return 'malformed'
  }
}
