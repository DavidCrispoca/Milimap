/**
 * Application shell.
 *
 * Navigation stays in local state (no router until Phase 6). The only cross-screen
 * action is "Cómo llegar", which opens the map with a destination preselected.
 */

import { useState } from 'react'
import { HomeScreen } from './ui/screens/HomeScreen'
import { PlaceholderScreen } from './ui/screens/PlaceholderScreen'
import { RouteDemoScreen } from './ui/screens/RouteDemoScreen'
import { ScannerScreen } from './ui/screens/ScannerScreen'
import type { NodeId, SpaceId } from './domain/types'

type View = 'home' | 'map' | 'scan' | 'schedule'

interface NavItem {
  id: View
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'map', label: 'Mapa', icon: '🗺️' },
  { id: 'scan', label: 'Escanear', icon: '📷' },
  { id: 'schedule', label: 'Horario', icon: '🗓️' },
]

const PLACEHOLDERS: Record<'schedule', { title: string; phase: number; body: string }> = {
  schedule: {
    title: 'Mi horario',
    phase: 6,
    body: 'Selección de clases del semestre y acceso directo a "cómo llegar" al salón de la clase en curso. Se guarda en el dispositivo, sin necesidad de cuenta.',
  },
}

export function App() {
  const [view, setView] = useState<View>('home')
  const [routeTarget, setRouteTarget] = useState<SpaceId | undefined>(undefined)
  const [originNodeId, setOriginNodeId] = useState<NodeId>('p1.ent')

  const openRoute = (spaceId: SpaceId) => {
    setRouteTarget(spaceId)
    setView('map')
  }

  // A scanned QR sets the student's origin, then they pick a destination on the map.
  const useScannedOrigin = (nodeId: NodeId) => {
    setOriginNodeId(nodeId)
    setRouteTarget(undefined)
    setView('map')
  }

  const placeholder = view === 'schedule' ? PLACEHOLDERS.schedule : null

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
        <span className="app__phase">Fase 5</span>
      </header>

      <main className="app__main">
        {view === 'home' ? (
          <HomeScreen onOpenRoute={openRoute} onOpenScanner={() => setView('scan')} />
        ) : view === 'map' ? (
          <RouteDemoScreen initialDestination={routeTarget} initialOrigin={originNodeId} />
        ) : view === 'scan' ? (
          <ScannerScreen onUseOrigin={useScannedOrigin} />
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
