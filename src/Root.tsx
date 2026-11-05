import { StrictMode, Suspense, lazy } from 'react'
import { App } from './App'

/**
 * Root switch between the student app and the admin console.
 *
 * The admin console is code-split: students never download it. The route check
 * is deliberately simple; there is no router until Phase 6.
 */
const AdminApp = lazy(() => import('./admin/AdminApp'))

export function Root() {
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '').startsWith('/admin')

  return (
    <StrictMode>
      {isAdminRoute ? (
        <Suspense fallback={<p style={{ padding: 24 }}>Cargando panel…</p>}>
          <AdminApp />
        </Suspense>
      ) : (
        <App />
      )}
    </StrictMode>
  )
}
