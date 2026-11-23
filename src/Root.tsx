import { StrictMode, Suspense, lazy } from 'react'
import { App } from './App'

/**
 * Root switch between the student app and the admin console.
 *
 * The admin console is code-split: students never download it.
 *
 * Two entry points on purpose:
 *  - `/admin` (the local dev URLs and the docs) — a plain pathname.
 *  - `#/admin` — works on any static host, including GitHub Pages project sites,
 *    where the app lives under `/<repo>/` and only the hash is ours to route.
 */
const AdminApp = lazy(() => import('./admin/AdminApp'))

function isAdminRoute(): boolean {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (path.endsWith('/admin')) return true
  return window.location.hash.replace(/^#\/?/, '').toLowerCase().startsWith('admin')
}

export function Root() {
  return (
    <StrictMode>
      {isAdminRoute() ? (
        <Suspense fallback={<p style={{ padding: 24 }}>Cargando panel…</p>}>
          <AdminApp />
        </Suspense>
      ) : (
        <App />
      )}
    </StrictMode>
  )
}
