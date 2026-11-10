import { createRoot } from 'react-dom/client'
import { Root } from './Root'
import { recordAppOpen } from './backend/analytics'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container #root not found in index.html')
}

// Fire-and-forget active-user signal. Never blocks first paint.
recordAppOpen()

// Register the service worker for offline support (Phase 8). Only in production,
// where the built app is served from a single origin; the dev server's HMR
// otherwise fights the cache.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.debug('[milimap] service worker registration failed', error)
    })
  })
}

createRoot(container).render(<Root />)
