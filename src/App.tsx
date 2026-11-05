/**
 * Application shell.
 *
 * Phase 0 keeps navigation in local state instead of a router: there is only a
 * handful of screens and none of them need deep links yet. Deep links
 * (`/destino/:spaceId`) arrive in Phase 6, together with a real router.
 */

import { useState } from 'react'
import { HomeScreen } from './ui/screens/HomeScreen'
import { PlaceholderScreen } from './ui/screens/PlaceholderScreen'

type View = 'home' | 'map' | 'scan' | 'schedule'

interface NavItem {
  id: View
  label: string
  icon: string
  /** Phase that makes this tab functional. `null` means it already works. */
  readyIn: number | null
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', icon: '🏠', readyIn: null },
  { id: 'map', label: 'Mapa', icon: '🗺️', readyIn: 4 },
  { id: 'scan', label: 'Escanear', icon: '📷', readyIn: 5 },
  { id: 'schedule', label: 'Horario', icon: '🗓️', readyIn: 6 },
]

const PLACEHOLDERS: Record<
  Exclude<View, 'home'>,
  { title: string; phase: number; body: string }
> = {
  map: {
    title: 'Mapa del campus',
    phase: 4,
    body: 'Vista 2D cenital con selector de piso, ruta resaltada e instrucciones paso a paso. Se construye sobre MapLibre GL JS con una fuente GeoJSON por piso.',
  },
  scan: {
    title: 'Escanear código QR',
    phase: 5,
    body: 'Lectura del QR con html5-qrcode (con respaldo WASM para iOS). Cada QR apunta a un nodo del grafo, así que corregir el mapa nunca invalida las etiquetas ya impresas.',
  },
  schedule: {
    title: 'Mi horario',
    phase: 6,
    body: 'Selección de clases del semestre y acceso directo a "cómo llegar" al salón de la clase en curso. Se guarda en el dispositivo, sin necesidad de cuenta.',
  },
}

export function App() {
  const [view, setView] = useState<View>('home')

  const placeholder = view === 'home' ? null : PLACEHOLDERS[view]

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__logo" aria-hidden="true">
          MM
        </div>
        <div className="app__brand">
          <span className="app__brand-name">Milimap</span>
          <span className="app__brand-sub">UMNG · Sede Calle 100</span>
        </div>
        <span className="app__phase">Fase 0</span>
      </header>

      <main className="app__main">
        {view === 'home' ? (
          <HomeScreen />
        ) : placeholder ? (
          <PlaceholderScreen
            title={placeholder.title}
            phase={placeholder.phase}
            body={placeholder.body}
          />
        ) : null}
      </main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === view
          return (
            <button
              key={item.id}
              type="button"
              className="bottom-nav__item"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setView(item.id)}
            >
              <span className="bottom-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
