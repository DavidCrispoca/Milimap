/**
 * Usage analytics.
 *
 * Append-only event recording to the Supabase backend. Every event carries a
 * `kind` and a small `payload`, so the admin analytics screen can later answer
 * "how many people use this" and "where do routes fail" from real data.
 *
 * The recording is deliberately non-blocking and failure-tolerant: if the
 * backend is not configured or the network drops, the app keeps working. See
 * `client.ts`.
 */

import { insertRow } from './client'

export type AnalyticsKind = 'scan' | 'search' | 'route' | 'failed_route' | 'app_open' | 'schedule'

export interface AnalyticsPayload {
  [key: string]: unknown
}

const TABLE = 'milimap_analytics_events'

/** Record one event. Never throws; always resolves (void). */
export function recordEvent(kind: AnalyticsKind, payload: AnalyticsPayload = {}): void {
  void insertRow(TABLE, { kind, payload }).catch(() => {
    /* last-resort guard: the client already swallows errors */
  })
}

/** A QR code was scanned (valid or invalid — the payload distinguishes). */
export function recordScan(payload: AnalyticsPayload = {}): void {
  recordEvent('scan', payload)
}

/** The student ran a destination search. */
export function recordSearch(query: string): void {
  recordEvent('search', { query })
}

/** A route was computed and shown. */
export function recordRoute(payload: AnalyticsPayload = {}): void {
  recordEvent('route', payload)
}

/** A route could not be computed. `code` is the typed error code. */
export function recordFailedRoute(code: string): void {
  recordEvent('failed_route', { code })
}

/** The app was opened (used as a rough active-user signal). */
export function recordAppOpen(): void {
  recordEvent('app_open', {})
}

/** The student picked a program/group for their schedule. */
export function recordScheduleSelection(payload: AnalyticsPayload = {}): void {
  recordEvent('schedule', payload)
}
