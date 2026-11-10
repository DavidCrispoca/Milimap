/**
 * Application shell.
 *
 * Navigation is a hash router (see `../router`), so tabs, deep links and QR
 * payloads all have shareable URLs and survive a reload. The map screen is
 * fully controlled from here: a QR scan sets the origin, "cómo llegar" sets the
 * destination.
 */

import { useCallback, useEffect, useState } from 'react'
import { HomeScreen } from './ui/screens/HomeScreen'
import { RouteDemoScreen } from './ui/screens/RouteDemoScreen'
import { ScannerScreen } from './ui/screens/ScannerScreen'
import { ScheduleScreen } from './ui/screens/ScheduleScreen'
import { InstallBanner } from './ui/InstallBanner'
import { hashFor, parseHash, type AppRoute } from './router'
import type { NodeId, SpaceId } from './domain/types'

type View = 'home' | 'map' | 'scan' | 'schedule'

interface NavItem {
  id: View
  route: AppRoute
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', route: { name: 'home' }, label: 'Inicio', icon: '🏠' },
  { id: 'map', route: { name: 'map' }, label: 'Mapa', icon: '🗺️' },
  { id: 'scan', route: { name: 'scan' }, label: 'Escanear', icon: '📷' },
  { id: 'schedule', route: { name: 'schedule' }, label: 'Horario', icon: '🗓️' },
]

/** The route the app booted on (deep link, QR URL, or plain root). */
const INITIAL_ROUTE: AppRoute = parseHash(window.location.hash)

function initialOrigin(route: AppRoute): NodeId {
  return route.name === 'route' ? route.origin : 'p1.ent'
}

function initialDestination(route: AppRoute): SpaceId | null {
  if (route.name === 'destination') return route.spaceId
  if (route.name === 'route') return route.destination
  return null
}

export function App() {
  const [view, setView] = useState<View>(() => {
    if (INITIAL_ROUTE.name === 'map') return 'map'
    if (INITIAL_ROUTE.name === 'scan' || INITIAL_ROUTE.name === 'qr') return 'scan'
    if (INITIAL_ROUTE.name === 'schedule') return 'schedule'
    if (INITIAL_ROUTE.name === 'destination' || INITIAL_ROUTE.name === 'route') return 'map'
    return 'home'
  })
  const [originNodeId, setOriginNodeId] = useState<NodeId>(() => initialOrigin(INITIAL_ROUTE))
  const [destinationSpaceId, setDestinationSpaceId] = useState<SpaceId | null>(() =>
    initialDestination(INITIAL_ROUTE),
  )
  const [scanPayload, setScanPayload] = useState<string | undefined>(() =>
    INITIAL_ROUTE.name === 'qr' ? INITIAL_ROUTE.payload : undefined,
  )

  // Route -> state, one way. The URL is an external system; this maps it onto
  // component state without extra cascades (runs on init via initializers and on
  // every hashchange via the listener below).
  const applyRoute = useCallback((route: AppRoute): void => {
    switch (route.name) {
      case 'home':
        setView('home')
        break
      case 'map':
        setView('map')
        break
      case 'scan':
        setScanPayload(undefined)
        setView('scan')
        break
      case 'schedule':
        setView('schedule')
        break
      case 'destination':
        setDestinationSpaceId(route.spaceId)
        setView('map')
        break
      case 'route':
        setOriginNodeId(route.origin)
        setDestinationSpaceId(route.destination)
        setView('map')
        break
      case 'qr':
        setScanPayload(route.payload)
        setView('scan')
        break
    }
  }, [])

  useEffect(() => {
    const onHashChange = (): void => applyRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [applyRoute])

  // Navigate: update the URL (so it is shareable and back-button friendly) and
  // apply the state immediately.
  const navigate = (route: AppRoute): void => {
    window.location.hash = hashFor(route)
    applyRoute(route)
  }

  const openRoute = (spaceId: SpaceId): void => navigate({ name: 'destination', spaceId })

  const useScannedOrigin = (nodeId: NodeId): void => {
    setOriginNodeId(nodeId)
    setDestinationSpaceId(null)
    navigate({ name: 'map' })
  }

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
        <span className="app__phase">Fase 6</span>
      </header>

      <main className="app__main">
        <InstallBanner />
        {view === 'home' ? (
          <HomeScreen
            onOpenRoute={openRoute}
            onOpenScanner={() => navigate({ name: 'scan' })}
            onOpenSchedule={() => navigate({ name: 'schedule' })}
          />
        ) : view === 'map' ? (
          <RouteDemoScreen
            originNodeId={originNodeId}
            destinationSpaceId={destinationSpaceId}
            onOriginChange={setOriginNodeId}
            onDestinationChange={setDestinationSpaceId}
          />
        ) : view === 'scan' ? (
          <ScannerScreen onUseOrigin={useScannedOrigin} initialPayload={scanPayload} />
        ) : view === 'schedule' ? (
          <ScheduleScreen onOpenRoute={openRoute} />
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
              onClick={() => navigate(item.route)}
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
