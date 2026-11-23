/**
 * Minimal i18n layer (Phase 8).
 *
 * Spanish is the source language; English is a peer dictionary with the same
 * keys. Locale is a user preference, persisted with the accessibility settings,
 * and also drives `document.lang`. Route instructions already carry both
 * languages in the domain model, so they use this locale directly in the map.
 */

import { useCallback } from 'react'
import { usePreferences, type Locale } from '@/ui/preferences'

const ES = {
  'nav.home': 'Inicio',
  'nav.map': 'Mapa',
  'nav.scan': 'Escanear',
  'nav.schedule': 'Horario',
  'nav.skip': 'Saltar al contenido',
  'shell.subtitle': 'UMNG · Sede Calle 100',
  'shell.loading': 'Cargando…',
  'pwa.offline.title': 'Sin conexión',
  'pwa.offline.body': 'El mapa y las rutas siguen funcionando con los datos guardados.',
  'pwa.online.title': 'Conexión restablecida',
  'pwa.update.title': 'Hay una versión nueva de Milimap',
  'pwa.update.body': 'Actualiza para tener los últimos planos y contenidos.',
  'pwa.update.action': 'Actualizar',
  'pwa.dismiss': 'Descartar',
  'pwa.install.title': 'Instala Milimap',
  'pwa.install.body': 'Tenlo en la pantalla de inicio, sin tienda.',
  'pwa.install.ios': 'Toca Compartir → Agregar a pantalla de inicio.',
  'pwa.install.action': 'Instalar',
  'a11y.title': 'Accesibilidad',
  'a11y.subtitle': 'Ajusta la app a cómo prefieres leerla y usarla.',
  'a11y.contrast': 'Alto contraste',
  'a11y.text': 'Texto grande',
  'a11y.motion': 'Menos animación',
  'a11y.language': 'Idioma',
  'a11y.reset': 'Valores por defecto',
  'a11y.note': 'Estos ajustes se guardan en este dispositivo.',
} as const

type Key = keyof typeof ES

const EN: Record<Key, string> = {
  'nav.home': 'Home',
  'nav.map': 'Map',
  'nav.scan': 'Scan',
  'nav.schedule': 'Schedule',
  'nav.skip': 'Skip to content',
  'shell.subtitle': 'UMNG · Calle 100 campus',
  'shell.loading': 'Loading…',
  'pwa.offline.title': 'Offline',
  'pwa.offline.body': 'The map and routes still work with the cached data.',
  'pwa.online.title': 'Back online',
  'pwa.update.title': 'A new version of Milimap is available',
  'pwa.update.body': 'Update to get the latest plans and content.',
  'pwa.update.action': 'Update',
  'pwa.dismiss': 'Dismiss',
  'pwa.install.title': 'Install Milimap',
  'pwa.install.body': 'Add it to your home screen, no app store needed.',
  'pwa.install.ios': 'Tap Share → Add to Home Screen.',
  'pwa.install.action': 'Install',
  'a11y.title': 'Accessibility',
  'a11y.subtitle': 'Adjust the app to the way you prefer to read and use it.',
  'a11y.contrast': 'High contrast',
  'a11y.text': 'Large text',
  'a11y.motion': 'Reduce motion',
  'a11y.language': 'Language',
  'a11y.reset': 'Reset to defaults',
  'a11y.note': 'These settings are saved on this device.',
}

export type TranslationKey = Key

export function translate(locale: Locale, key: TranslationKey): string {
  return locale === 'en' ? EN[key] : ES[key]
}

export function useT(): (key: TranslationKey) => string {
  const { prefs } = usePreferences()
  return useCallback((key: TranslationKey) => translate(prefs.locale, key), [prefs.locale])
}
