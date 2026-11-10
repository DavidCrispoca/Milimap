/**
 * Thin PostgREST client for Supabase.
 *
 * Deliberately hand-rolled instead of pulling in `@supabase/supabase-js`: the
 * app only needs a couple of append-only writes for analytics, and every extra
 * kilobyte in the student bundle matters. PostgREST is a plain HTTP API.
 *
 * All calls are fire-and-forget and never throw. Analytics must not interfere
 * with navigation, so a network error is swallowed and logged, not surfaced.
 */

import { readBackendConfig } from './config'

export interface PostgrestResult {
  ok: boolean
  status?: number
}

/** Best-effort POST of one row to a table. Resolves `{ ok: false }` on any error. */
export async function insertRow(
  table: string,
  row: Record<string, unknown>,
): Promise<PostgrestResult> {
  const config = readBackendConfig()
  if (!config) return { ok: false }

  try {
    const response = await fetch(`${config.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
      // Keep the request alive through a page transition.
      keepalive: true,
    })

    return { ok: response.ok, status: response.status }
  } catch (error) {
    // Never throw from an analytics call.
    console.debug('[milimap] analytics write failed', error)
    return { ok: false }
  }
}
