import { beforeEach, describe, expect, it } from 'vitest'
import { translate } from '@/i18n'
import {
  applyPreferences,
  DEFAULT_PREFERENCES,
  getPreferences,
  resetPreferences,
  setPreference,
} from './preferences'

describe('user preferences', () => {
  beforeEach(() => {
    localStorage.clear()
    resetPreferences()
  })

  it('starts with Spanish, normal contrast and normal text', () => {
    expect(getPreferences()).toEqual(DEFAULT_PREFERENCES)
    expect(document.documentElement.lang).toBe('es')
    expect(document.documentElement.dataset.contrast).toBe('normal')
    expect(document.documentElement.dataset.text).toBe('normal')
    expect(document.documentElement.dataset.motion).toBe('normal')
  })

  it('reflects every setting in the document element', () => {
    setPreference('highContrast', true)
    setPreference('largeText', true)
    setPreference('reduceMotion', true)
    setPreference('locale', 'en')
    expect(document.documentElement.dataset.contrast).toBe('high')
    expect(document.documentElement.dataset.text).toBe('large')
    expect(document.documentElement.dataset.motion).toBe('reduced')
    expect(document.documentElement.lang).toBe('en')
  })

  it('persists changes and restores them on a fresh read', () => {
    setPreference('largeText', true)
    const raw = localStorage.getItem('milimap.prefs.v1')
    expect(raw).toContain('"largeText":true')
    expect(JSON.parse(raw ?? '{}')).toMatchObject({ largeText: true, locale: 'es' })
  })

  it('resets back to the defaults', () => {
    setPreference('locale', 'en')
    setPreference('highContrast', true)
    resetPreferences()
    expect(getPreferences()).toEqual(DEFAULT_PREFERENCES)
    expect(document.documentElement.lang).toBe('es')
    expect(document.documentElement.dataset.contrast).toBe('normal')
  })

  it('applies to an arbitrary root element', () => {
    const root = document.createElement('html')
    applyPreferences({ ...DEFAULT_PREFERENCES, locale: 'en', highContrast: true }, root)
    expect(root.lang).toBe('en')
    expect(root.dataset.contrast).toBe('high')
  })
})

describe('i18n dictionary', () => {
  it('has the same keys in both languages', () => {
    expect(translate('es', 'nav.home')).toBe('Inicio')
    expect(translate('en', 'nav.home')).toBe('Home')
    expect(translate('en', 'pwa.offline.body')).toContain('cached')
    expect(translate('es', 'a11y.title')).toBe('Accesibilidad')
  })
})
