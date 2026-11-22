/**
 * Service worker lifecycle + connectivity (Phase 8).
 *
 * Registration lives in a hook instead of `main.tsx` so the UI can react to a
 * pending update and to offline/online transitions. In development the worker
 * is off unless `?sw=1` is present: Vite's HMR and a caching worker fight each
 * other, but the flag keeps the offline path testable without a full build.
 */

import { useEffect, useRef, useState } from 'react'

export interface ServiceWorkerStatus {
  supported: boolean
  offline: boolean
  updateReady: boolean
  applyUpdate: () => void
}

export function useServiceWorker(): ServiceWorkerStatus {
  const supported =
    typeof navigator !== 'undefined' &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    (import.meta.env.PROD || new URLSearchParams(window.location.search).has('sw'))
  const [offline, setOffline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine === false : false,
  )
  const [updateReady, setUpdateReady] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const shouldReload = useRef(false)

  useEffect(() => {
    const goOffline = (): void => setOffline(true)
    const goOnline = (): void => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  useEffect(() => {
    if (!supported) return
    const cancelled = { current: false }

    const watch = (found: ServiceWorkerRegistration): void => {
      if (cancelled.current) return
      setRegistration(found)
      if (found.waiting) setUpdateReady(true)

      found.addEventListener('updatefound', () => {
        const installing = found.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateReady(true)
          }
        })
      })
    }

    void navigator.serviceWorker
      .register('/sw.js')
      .then(watch)
      .catch(() => {
        // Offline support is an enhancement; a failed registration never blocks the app.
      })

    const onControllerChange = (): void => {
      if (!shouldReload.current) return
      shouldReload.current = false
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    return () => {
      cancelled.current = true
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [supported])

  const applyUpdate = (): void => {
    if (registration?.waiting) {
      shouldReload.current = true
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      return
    }
    window.location.reload()
  }

  return { supported, offline, updateReady, applyUpdate }
}
