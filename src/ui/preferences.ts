/**
 * User preferences (Phase 8).
 *
 * Preferences survive reloads and are applied to <html> before React renders, so
 * high contrast / large text never flash in and out on startup. A tiny external
 * store is enough here: no context provider, no prop drilling, one definition of
 * the defaults shared by the app, the settings card and the tests.
 */

import { useSyncExternalStore } from 'react'

export type Locale = 'es' | 'en'

export interface Preferences {
  locale: Locale
  highContrast: boolean
  largeText: boolean
  reduceMotion: boolean
}

export const DEFAULT_PREFERENCES: Preferences = {
  locale: 'es',
  highContrast: false,
  largeText: false,
  reduceMotion: false,
}

const STORAGE_KEY = 'milimap.prefs.v1'

function load(): Preferences {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_PREFERENCES }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    const parsed = JSON.parse(raw) as Partial<Preferences>
    return {
      locale: parsed.locale === 'en' ? 'en' : 'es',
      highContrast: parsed.highContrast === true,
      largeText: parsed.largeText === true,
      reduceMotion: parsed.reduceMotion === true,
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

let current = load()
const listeners = new Set<() => void>()

/** Reflect the preferences in the document so CSS can react without re-renders. */
export function applyPreferences(prefs: Preferences, root?: HTMLElement): void {
  const target = root ?? document.documentElement
  target.lang = prefs.locale
  target.dataset.contrast = prefs.highContrast ? 'high' : 'normal'
  target.dataset.text = prefs.largeText ? 'large' : 'normal'
  target.dataset.motion = prefs.reduceMotion ? 'reduced' : 'normal'
}

if (typeof document !== 'undefined') applyPreferences(current)

function notify(): void {
  applyPreferences(current)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Private browsing with storage disabled: settings still work for this tab.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Preferences {
  return current
}

export function getPreferences(): Preferences {
  return current
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  if (current[key] === value) return
  current = { ...current, [key]: value }
  notify()
}

export function resetPreferences(): void {
  current = { ...DEFAULT_PREFERENCES }
  notify()
}

/** Read/write preferences from any component without a provider. */
export function usePreferences(): {
  prefs: Preferences
  set: typeof setPreference
  reset: typeof resetPreferences
} {
  return {
    prefs: useSyncExternalStore(subscribe, getSnapshot, getSnapshot),
    set: setPreference,
    reset: resetPreferences,
  }
}
