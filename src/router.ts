/**
 * Hash router (Phase 6).
 *
 * Deep links and shareable URLs without a server router. Hash-based on purpose:
 * the app is a static PWA, and `#/…` works on any static host (Vercel, Pages,
 * Cloudflare tunnel) with zero rewrite rules.
 *
 * Routes:
 *   #/                     home
 *   #/mapa                 map
 *   #/escanear             QR scanner
 *   #/horario              my schedule
 *   #/destino/A104         map with A104 as destination
 *   #/ruta/p1.ent/A104     map with origin + destination
 *   #/qr/<payload>         scanner pre-loaded with a payload
 */

export type AppRoute =
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'scan' }
  | { name: 'schedule' }
  | { name: 'destination'; spaceId: string }
  | { name: 'route'; origin: string; destination: string }
  | { name: 'qr'; payload: string }

/** Parse a `location.hash` value into a route. Unknown inputs fall back to home. */
export function parseHash(hash: string): AppRoute {
  const trimmed = hash.replace(/^#\/?/, '').trim()
  if (!trimmed) return { name: 'home' }

  const segments = trimmed.split('/').map((part) => decodeURIComponent(part))
  const head = (segments[0] ?? '').toLowerCase()

  switch (head) {
    case 'mapa':
    case 'map':
      return { name: 'map' }
    case 'escanear':
    case 'scan':
      return { name: 'scan' }
    case 'horario':
    case 'schedule':
      return { name: 'schedule' }
    case 'destino':
    case 'destination': {
      const spaceId = segments[1]
      return spaceId ? { name: 'destination', spaceId } : { name: 'home' }
    }
    case 'ruta':
    case 'route': {
      const origin = segments[1]
      const destination = segments[2]
      return origin && destination ? { name: 'route', origin, destination } : { name: 'home' }
    }
    case 'qr': {
      const payload = segments[1]
      return payload ? { name: 'qr', payload } : { name: 'scan' }
    }
    default:
      return { name: 'home' }
  }
}

/** Serialize a route to a `location.hash` value (leading `#/`). */
export function hashFor(route: AppRoute): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'map':
      return '#/mapa'
    case 'scan':
      return '#/escanear'
    case 'schedule':
      return '#/horario'
    case 'destination':
      return `#/destino/${encodeURIComponent(route.spaceId)}`
    case 'route':
      return `#/ruta/${encodeURIComponent(route.origin)}/${encodeURIComponent(route.destination)}`
    case 'qr':
      return `#/qr/${encodeURIComponent(route.payload)}`
  }
}

/** A shareable link for a destination (used by "compartir"). */
export function destinationLink(spaceId: string): string {
  return hashFor({ name: 'destination', spaceId })
}
