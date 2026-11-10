/**
 * Backend configuration.
 *
 * Values come from Vite env vars (`.env`, git-ignored) so the URL and key are
 * never committed. When they are missing the backend simply degrades: the app
 * keeps working offline and analytics is skipped. That is deliberate for the
 * MVP — the backend must never be able to break the front end.
 */

export interface BackendConfig {
  /** Supabase project URL, e.g. https://<ref>.supabase.co */
  url: string
  /** Publishable (anon) key. Safe to ship; it is scoped by RLS. */
  anonKey: string
}

/** Read the config from the environment, or null when not configured. */
export function readBackendConfig(): BackendConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url || !anonKey) return null
  return { url, anonKey }
}
