/**
 * Admin console shell: session gate, navigation and page routing.
 *
 * Loaded lazily from main.tsx only on /admin, so students never download this
 * code or its styles.
 */

import { useState } from 'react'
import { useContentStore } from '@/content/store'
import { ROLE_LABEL } from '@/content/permissions'
import { LoginScreen } from './LoginScreen'
import { DashboardPage } from './pages/DashboardPage'
import { EventsPage } from './pages/EventsPage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { SpacesPage } from './pages/SpacesPage'
import { SchedulePage } from './pages/SchedulePage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import './styles/admin.css'

type PageId = 'dashboard' | 'events' | 'announcements' | 'spaces' | 'schedule' | 'analytics'

interface PageDef {
  id: PageId
  label: string
  icon: string
  group: string
  eyebrow: string
  heading: string
}

const PAGES: PageDef[] = [
  {
    id: 'dashboard',
    label: 'Resumen',
    icon: '◎',
    group: 'General',
    eyebrow: 'General',
    heading: 'Resumen',
  },
  {
    id: 'events',
    label: 'Eventos',
    icon: '◆',
    group: 'Contenido',
    eyebrow: 'Contenido',
    heading: 'Eventos',
  },
  {
    id: 'announcements',
    label: 'Anuncios',
    icon: '◉',
    group: 'Contenido',
    eyebrow: 'Contenido',
    heading: 'Anuncios',
  },
  {
    id: 'spaces',
    label: 'Espacios',
    icon: '▣',
    group: 'Contenido',
    eyebrow: 'Contenido',
    heading: 'Espacios',
  },
  {
    id: 'schedule',
    label: 'Horarios',
    icon: '▤',
    group: 'Operación',
    eyebrow: 'Operación',
    heading: 'Horarios del semestre',
  },
  {
    id: 'analytics',
    label: 'Analítica',
    icon: '▥',
    group: 'Operación',
    eyebrow: 'Operación',
    heading: 'Analítica',
  },
]

const PAGE_COMPONENTS: Record<PageId, () => React.JSX.Element> = {
  dashboard: DashboardPage,
  events: EventsPage,
  announcements: AnnouncementsPage,
  spaces: SpacesPage,
  schedule: SchedulePage,
  analytics: AnalyticsPage,
}

export default function AdminApp() {
  const role = useContentStore((state) => state.role)
  const setRole = useContentStore((state) => state.setRole)
  const [page, setPage] = useState<PageId>('dashboard')

  if (!role) return <LoginScreen />

  const current = PAGES.find((item) => item.id === page) ?? PAGES[0]!
  const Page = PAGE_COMPONENTS[page]
  const groups = [...new Set(PAGES.map((item) => item.group))]

  return (
    <div className="admin">
      <aside className="admin__sidebar" aria-label="Navegación del panel">
        <div className="admin__brand">
          <span className="admin__brand-mark" aria-hidden="true">
            MM
          </span>
          <div className="admin__brand-text">
            <span className="admin__brand-title">Milimap</span>
            <span className="admin__brand-sub">Administración · Calle 100</span>
          </div>
        </div>

        <nav className="admin__nav">
          {groups.map((group) => (
            <div key={group}>
              <p className="admin__nav-group">{group}</p>
              {PAGES.filter((item) => item.group === group).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="admin__nav-item"
                  aria-current={item.id === page ? 'page' : undefined}
                  onClick={() => setPage(item.id)}
                >
                  <span className="admin__nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin__sidebar-footer">
          <span className="role-chip">
            <span className="role-chip__dot" aria-hidden="true" />
            {ROLE_LABEL[role]}
          </span>
          <button type="button" className="btn btn--sm" onClick={() => setRole(null)}>
            Cambiar acceso
          </button>
          <a className="admin__sidebar-link" href="/">
            ← Volver a la app
          </a>
          <p className="admin__demo-note">
            Datos guardados en este navegador. Sin backend compartido todavía.
          </p>
        </div>
      </aside>

      <div className="admin__main">
        <header className="admin__topbar">
          <div className="admin__topbar-title">
            <span className="admin__topbar-eyebrow">{current.eyebrow}</span>
            <h1 className="admin__topbar-heading">{current.heading}</h1>
          </div>
        </header>

        <main className="admin__content">
          <Page />
        </main>
      </div>
    </div>
  )
}
