/**
 * Simulated student session.
 *
 * The institutional backend does not exist yet, so any non-empty identifier and
 * password are accepted. Only the identifier (and a display name derived from
 * it) is stored on-device; the password never leaves the form. A guest choice is
 * stored too, so the welcome screen does not reappear on every reload.
 */

import { useSyncExternalStore } from 'react'

export interface UserSession {
  kind: 'user'
  email: string
  name: string
  signedInAt: string
}

export interface GuestSession {
  kind: 'guest'
}

export type Session = UserSession | GuestSession

export const SESSION_KEY = 'milimap.session.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function load(): Session | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    if (parsed.kind === 'guest') return { kind: 'guest' }
    if (
      parsed.kind === 'user' &&
      typeof parsed.email === 'string' &&
      parsed.email.trim() !== '' &&
      typeof parsed.name === 'string' &&
      parsed.name.trim() !== ''
    ) {
      return {
        kind: 'user',
        email: parsed.email,
        name: parsed.name,
        signedInAt: typeof parsed.signedInAt === 'string' ? parsed.signedInAt : '',
      }
    }
    return null
  } catch {
    return null
  }
}

let current: Session | null = load()
const listeners = new Set<() => void>()

function notify(): void {
  try {
    if (current) localStorage.setItem(SESSION_KEY, JSON.stringify(current))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // Private browsing with storage disabled: the session lives in memory only.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Session | null {
  return current
}

/** Turn an arbitrary identifier into a readable name ("ana.lopez@…" → "Ana Lopez"). */
export function displayNameFrom(identifier: string): string {
  const localPart = identifier.trim().split('@')[0] ?? ''
  const words = localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)

  if (words.length === 0) return 'Estudiante'
  return words
    .map((word) => word.charAt(0).toLocaleUpperCase('es') + word.slice(1).toLocaleLowerCase('es'))
    .join(' ')
}

export function getSession(): Session | null {
  return current
}

/**
 * Start a simulated student session. Returns null for an empty identifier so
 * the form can ask for credentials; any non-empty value is accepted.
 */
export function signIn(identifier: string): UserSession | null {
  const email = identifier.trim()
  if (!email) return null

  const session: UserSession = {
    kind: 'user',
    email,
    name: displayNameFrom(email),
    signedInAt: new Date().toISOString(),
  }
  current = session
  notify()
  return session
}

export function continueAsGuest(): GuestSession {
  const session: GuestSession = { kind: 'guest' }
  current = session
  notify()
  return session
}

export function signOut(): void {
  current = null
  notify()
}

/** Clear the session without notifying. Used by tests and fresh starts. */
export function resetSession(): void {
  current = null
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Ignore storage failures.
  }
  listeners.forEach((listener) => listener())
}

export function useSession(): {
  session: Session | null
  signIn: typeof signIn
  continueAsGuest: typeof continueAsGuest
  signOut: typeof signOut
} {
  return {
    session: useSyncExternalStore(subscribe, getSnapshot, getSnapshot),
    signIn,
    continueAsGuest,
    signOut,
  }
}
