/**
 * Application shell.
 *
 * Navigation is a hash router (see `../router`), so tabs, deep links and QR
 * payloads all have shareable URLs and survive a reload. The map screen is
 * fully controlled from here: a QR scan sets the origin, "cómo llegar" sets the
 * destination.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n'
import { useSession } from '@/auth/session'
import { AuthScreen } from './ui/AuthScreen'
import { HomeScreen } from './ui/screens/HomeScreen'
import { RouteDemoScreen } from './ui/screens/RouteDemoScreen'
import { ScannerScreen } from './ui/screens/ScannerScreen'
import { ScheduleScreen } from './ui/screens/ScheduleScreen'
import { InstallBanner } from './ui/InstallBanner'
import { PwaStatus } from './ui/PwaStatus'
import { hashFor, parseHash, type AppRoute } from './router'
import type { NodeId, SpaceId } from './domain/types'

type View = 'home' | 'map' | 'scan' | 'schedule'

const NAV_ITEMS: Array<{
  id: View
  route: AppRoute
  labelKey: 'nav.home' | 'nav.map' | 'nav.scan' | 'nav.schedule'
  icon: string
}> = [
  { id: 'home', route: { name: 'home' }, labelKey: 'nav.home', icon: '🏠' },
  { id: 'map', route: { name: 'map' }, labelKey: 'nav.map', icon: '🗺️' },
  { id: 'scan', route: { name: 'scan' }, labelKey: 'nav.scan', icon: '📷' },
  { id: 'schedule', route: { name: 'schedule' }, labelKey: 'nav.schedule', icon: '🗓️' },
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
  const t = useT()
  const { session } = useSession()
  const mainRef = useRef<HTMLElement | null>(null)
  const firstView = useRef(true)
  const [authOpen, setAuthOpen] = useState(false)
  const user = session?.kind === 'user' ? session : null
  const canUseSchedule = user !== null
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
  const showAuth = !session || authOpen
  const navItems = canUseSchedule ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.id !== 'schedule')

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

  // Screen-reader users get an announcement and a stable focus target on every
  // tab change, but focus is not stolen on the initial load.
  useEffect(() => {
    if (showAuth) {
      document.title = 'Entrar · Milimap'
      return
    }
    const label = t(NAV_ITEMS.find((item) => item.id === view)?.labelKey ?? 'nav.home')
    document.title = `${label} · Milimap`
    if (firstView.current) {
      firstView.current = false
      return
    }
    mainRef.current?.focus()
  }, [showAuth, view, t])

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

  if (showAuth) {
    return <AuthScreen canCancel={session !== null} onDone={() => setAuthOpen(false)} />
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        {t('nav.skip')}
      </a>
      <header className="app__header">
        <div className="app__logo" aria-hidden="true">
          MM
        </div>
        <div className="app__brand">
          <span className="app__brand-name">Milimap</span>
          <span className="app__brand-sub">{t('shell.subtitle')}</span>
        </div>
        <button
          type="button"
          className="app__account"
          onClick={() => setAuthOpen(true)}
          aria-label={user ? `Cuenta de ${user.name}` : 'Iniciar sesión'}
        >
          <span className="app__account-icon" aria-hidden="true">
            {user ? '👤' : '→'}
          </span>
          <span className="app__account-label">{user ? user.name : 'Iniciar sesión'}</span>
        </button>
      </header>

      <main className="app__main" id="main-content" ref={mainRef} tabIndex={-1}>
        <PwaStatus />
        <InstallBanner />
        {view === 'home' ? (
          <HomeScreen
            isAuthenticated={canUseSchedule}
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
          canUseSchedule ? (
            <ScheduleScreen onOpenRoute={openRoute} />
          ) : (
            <section className="card card--brand">
              <p className="card__eyebrow">Mi horario</p>
              <h1 className="card__title">Inicia sesión para ver tu horario</h1>
              <p className="card__body">
                El horario se guarda en este dispositivo y se activa al iniciar sesión. Como
                invitado puedes seguir usando el mapa, el escáner y las rutas.
              </p>
              <div className="pill-row" style={{ marginTop: 'var(--space-3)' }}>
                <button type="button" className="btn-primary" onClick={() => setAuthOpen(true)}>
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate({ name: 'home' })}
                >
                  Volver al inicio
                </button>
              </div>
            </section>
          )
        ) : null}
      </main>

      <div className="sr-only" role="status" aria-live="polite">
        {t(NAV_ITEMS.find((item) => item.id === view)?.labelKey ?? 'nav.home')}
      </div>

      <nav
        className="bottom-nav"
        aria-label="Navegación principal"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => {
          const isActive = item.id === view
          return (
            <button
              key={item.id}
              type="button"
              className="bottom-nav__item"
              aria-current={isActive ? 'page' : undefined}
              aria-label={t(item.labelKey)}
              onClick={() => navigate(item.route)}
            >
              <span className="bottom-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{t(item.labelKey)}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
