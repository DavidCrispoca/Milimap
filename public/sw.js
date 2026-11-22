/**
 * Milimap service worker (Phase 8).
 *
 * Strategy:
 *  - Install: precache the shell, the offline page, the manifest and every
 *    same-origin asset referenced by index.html (hashed JS/CSS included).
 *  - Navigations: network-first, falling back to the cached shell.
 *  - Static assets: cache-first with background revalidation.
 *  - Cross-origin and non-GET requests: untouched.
 *
 * `ignoreVary` is deliberate: Vite's static responses carry `Vary: Origin`, and
 * index.html marks JS/CSS as `crossorigin`, so the browser sends an Origin header
 * that was not present when the entry was cached. A strict match would miss the
 * entry and the offline reload would fail with ERR_FAILED.
 *
 * Updates wait for the user to confirm ("Actualizar") through SKIP_WAITING.
 */

const VERSION = 'v6'
const CACHE = `milimap-${VERSION}`
const SHELL = '/'
const OFFLINE = '/offline.html'
const MANIFEST = '/manifest.webmanifest'

const MATCH = { ignoreVary: true }

async function precacheAppShell() {
  const cache = await caches.open(CACHE)
  const precache = [SHELL, OFFLINE, MANIFEST, '/favicon.svg']
  await Promise.allSettled(precache.map((url) => cache.add(url)))

  // Vite hashes the asset names, so read them from the built HTML instead of
  // keeping a build-time manifest in sync.
  try {
    const response = await fetch(SHELL, { cache: 'no-store' })
    if (response.ok) {
      const html = await response.text()
      const urls = new Set()
      const pattern = /(?:src|href)="(\/[^"]+)"/g
      let match
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1]
        if (url && !precache.includes(url)) urls.add(url)
      }
      await Promise.allSettled([...urls].map((url) => cache.add(url)))
    }
  } catch {
    // A failed precache must not fail the install: the runtime cache still fills
    // as the user visits pages.
  }

  // The manifest icons are fetched by the browser on install, not by index.html.
  try {
    const response = await caches.match(MANIFEST, MATCH)
    if (!response) return
    const manifest = await response.json()
    const icons = (manifest.icons ?? []).map((icon) => icon.src).filter(Boolean)
    await Promise.allSettled(icons.map((url) => cache.add(url)))
  } catch {
    // Icons are cosmetic for offline navigation.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAppShell())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') void self.skipWaiting()
})

/** Cache-first for third-party fonts, so offline mode keeps the same typography. */
async function offlineFontFallback(request) {
  if (request.destination !== 'font') return new Response('', { status: 204 })
  const cache = await caches.open(CACHE)
  const keys = await cache.keys()
  const anyFont = keys.find((entry) => new URL(entry.url).pathname.endsWith('.woff2'))
  return (anyFont && (await cache.match(anyFont))) ?? new Response('', { status: 204 })
}

function fromCrossOriginCache(request, cached) {
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') {
        const copy = response.clone()
        void caches.open(CACHE).then((cache) => cache.put(request, copy))
      }
      return response
    })
    .catch(() => cached ?? offlineFontFallback(request))
  return cached ?? network
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    if (request.destination === 'style' || request.destination === 'font') {
      event.respondWith(
        caches.match(request, MATCH).then((cached) => fromCrossOriginCache(request, cached)),
      )
    }
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (url.pathname === '/' || url.pathname === '') {
            const copy = response.clone()
            void caches.open(CACHE).then((cache) => cache.put(SHELL, copy))
          }
          return response
        })
        .catch(async () => {
          const cached =
            (await caches.match(request, MATCH)) ??
            (await caches.match(SHELL, MATCH)) ??
            (await caches.match(OFFLINE, MATCH))
          return cached ?? Response.error()
        }),
    )
    return
  }

  event.respondWith(
    caches.match(request, MATCH).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            void caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached ?? new Response('', { status: 204 }))
      return cached ?? network
    }),
  )
})
