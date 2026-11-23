/**
 * Generate test QR stickers for the main places of the Calle 100 campus.
 *
 * The point of this script is to make the scanner testable *before* the physical
 * stickers exist: it renders one PNG per place, plus a printable HTML sheet that
 * a phone can scan from another screen.
 *
 * Payloads use the same wire format the app parses (`src/domain/qr.ts`), and every
 * code is round-tripped through `parseQr` + `resolveQrNode` before being written.
 * A code that would not resolve in the app is a build error, not a surprise on
 * campus.
 *
 * Usage:
 *   npm run gen:qr                          # payloads like MILIMAP:v1:…
 *   npm run gen:qr -- --base-url=https://…  # payloads are URLs, so the phone's
 *                                           # native camera opens the app
 *
 * Output: `public/qrs/` (generated, gitignored).
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toBuffer } from 'qrcode'
import { calle100Campus } from '../src/data/index'
import { QR_VERSION, parseQr, resolveQrNode, serializeQr } from '../src/domain/qr'
import type { Floor, GraphNode } from '../src/domain/types'
import { describeNodeAt } from '../src/scanner/flow'

const TOOLS_DIR = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(TOOLS_DIR, '../public/qrs')

interface Entry {
  payload: string
  name: string
  floor: Floor
  node: GraphNode
  /** Higher means "more likely to be asked for", used for publishing stickers. */
  rank: number
}

/**
 * Places a visitor actually asks for: the ones worth printing first.
 * Kept as ids (not names) so a rename in the data does not silently drop a code.
 */
const CURATED_SPACES = [
  // Floor 1 — entrances, services and the landmarks everyone looks for.
  'BIBLIOTECA-CENTRAL',
  'AULA-MAXIMA-EXT',
  'RECEPCION-PPAL',
  'PLAZA-CERVANTES',
  'PLAZOLETA-ARTES',
  'PLAZOLETA-COMIDA',
  'CANCHAS-DEPORTIVAS',
  'CARNETIZACION',
  'PARQUEADERO-PPAL',
  'RESTAURANTE-MUY',
  'BLOQUE-F',
  'AULA-E101',
  'AULA-C101',
  'HEMEROTECA',
  // Floor 2 — auditoriums, labs and one classroom per block.
  'SALON-SANTANDER',
  'AUD-ESTEBAN-JARAMILLO',
  'AUD-GERMAN-ARCINIEGAS',
  'SALA-SISTEMAS-1',
  'D202',
  'AE-E202',
  // Floor 3 — the biggest classroom floor.
  'C308',
  'D302',
  'E305',
  'B301',
  'P301',
  // Floor 4.
  'E407',
  'AE-E401',
  'RAMA-IEEE',
  // Floor 5 — laboratories.
  'LAB-ELECTRONICA',
  'REALIDAD-VIRTUAL',
  'LAB3-MULTI',
  'LAB-REDES-TELECO',
  'DOCTORADO-INNOVACION',
]

/**
 * Vertical cores. Two floors of the same core prove that a scan in one floor can
 * route to a classroom in another.
 */
const CURATED_CORE_KEYS = ['ASC-D', 'ASC-E', 'ESC-D', 'ASC-D-P2', 'ASC-E-P5']

function parseBaseUrl(argv: readonly string[]): string | null {
  const flag = argv.find((arg) => arg.startsWith('--base-url='))
  const raw = flag ? flag.slice('--base-url='.length) : process.env.MILIMAP_QR_BASE_URL
  if (!raw) return null

  const trimmed = raw.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`--base-url debe empezar por http(s):// (recibido: "${trimmed}")`)
  }
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
}

/** Slug safe for a file name on Windows, macOS and Linux. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildEntries(baseUrl: string | null): Entry[] {
  const { building, floors } = calle100Campus
  const entries = new Map<string, Entry>()

  const add = (floor: Floor, node: GraphNode, name: string, rank: number): void => {
    if (!node.qrKey) return
    if (entries.has(node.id)) return

    const raw = serializeQr({
      version: QR_VERSION,
      buildingId: building.id,
      floorKey: floor.levelShort,
      nodeKey: node.qrKey,
    })
    // The URL form keeps the payload verbatim (no percent-encoding): the router
    // splits on "/", and the payload has none, so `#/qr/MILIMAP:v1:…` parses as
    // one segment and `parseQr` still recognises it.
    const payload = baseUrl ? `${baseUrl}#/qr/${raw}` : raw

    // Fail closed: a printed sticker that the app rejects is worse than no sticker.
    const parsed = parseQr(payload)
    if (!parsed.ok) throw new Error(`Payload inválido para ${name}: ${payload}`)
    const resolved = resolveQrNode(building, floors, parsed.payload)
    if (resolved !== node.id) {
      throw new Error(`El QR de ${name} (${payload}) resuelve a "${resolved ?? 'nada'}"`)
    }

    entries.set(node.id, { payload, name, floor, node, rank })
  }

  // 1. Entrances: the most likely starting point for a visitor.
  for (const floor of floors) {
    for (const node of floor.nodes) {
      if (node.kind === 'entrance') add(floor, node, describeNodeAt(calle100Campus, node.id), 0)
    }
  }

  // 2. Vertical cores. The key disambiguates the two cores on the same floor.
  for (const floor of floors) {
    for (const node of floor.nodes) {
      if (node.qrKey && CURATED_CORE_KEYS.includes(node.qrKey)) {
        const label = describeNodeAt(calle100Campus, node.id)
        add(floor, node, `${label} (${node.qrKey})`, 1)
      }
    }
  }

  // 3. Landmark spaces, by the name people use.
  for (const spaceId of CURATED_SPACES) {
    const floor = floors.find((candidate) => candidate.spaces.some((space) => space.id === spaceId))
    const space = floor?.spaces.find((candidate) => candidate.id === spaceId)
    if (!floor || !space) {
      console.warn(`  aviso: "${spaceId}" ya no existe en los datos; se omite`)
      continue
    }
    const node = floor.nodes.find((candidate) => candidate.id === space.anchorNodeId)
    if (!node?.qrKey) {
      console.warn(`  aviso: "${space.name}" no tiene nodo con qrKey; se omite`)
      continue
    }
    add(floor, node, space.name, 2)
  }

  return [...entries.values()].sort(
    (a, b) =>
      a.floor.order - b.floor.order || a.rank - b.rank || a.name.localeCompare(b.name, 'es'),
  )
}

function renderGallery(entries: readonly Entry[], baseUrl: string | null): string {
  const date = new Date().toISOString().slice(0, 10)

  const cards = entries
    .map((entry) => {
      const file = `qr-${slugify(`${entry.floor.levelShort}-${entry.node.qrKey}`)}.png`
      const deepLink = `../#/qr/${encodeURIComponent(entry.payload)}`
      return `
      <article class="card">
        <img src="./${file}" alt="Código QR de ${escapeHtml(entry.name)}" width="220" height="220" loading="lazy" />
        <div class="card__body">
          <p class="card__floor">${escapeHtml(entry.floor.levelShort)} · ${escapeHtml(entry.floor.levelLabel)}</p>
          <h2>${escapeHtml(entry.name)}</h2>
          <code>${escapeHtml(entry.payload)}</code>
          <a href="${escapeHtml(deepLink)}" class="card__link">Abrir en la app</a>
        </div>
      </article>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Milimap · Códigos QR de prueba</title>
    <style>
      :root { color-scheme: light; --navy: #112358; --gold: #fcc400; --line: #d7dbe7; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 24px; font-family: "Open Sans", system-ui, sans-serif; color: #1a1f2b; background: #f5f6fa; }
      header { max-width: 1100px; margin: 0 auto 24px; }
      h1 { margin: 0 0 8px; color: var(--navy); font-size: 1.6rem; }
      .lede { margin: 0 0 12px; max-width: 70ch; line-height: 1.55; }
      .meta { font-size: 0.85rem; color: #4a5265; }
      ol { max-width: 70ch; line-height: 1.6; }
      .grid { max-width: 1100px; margin: 0 auto; display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
      .card { background: #fff; border: 1px solid var(--line); border-top: 4px solid var(--gold); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
      .card img { align-self: center; border-radius: 8px; }
      .card__body { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
      .card__floor { margin: 0; font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; color: #5b6376; }
      .card h2 { margin: 0; font-size: 1rem; line-height: 1.3; }
      code { font-size: 0.68rem; word-break: break-all; color: #3c4354; background: #f0f2f8; padding: 4px 6px; border-radius: 6px; }
      .card__link { font-size: 0.8rem; color: var(--navy); font-weight: 600; }
      button { font: inherit; font-weight: 600; padding: 10px 16px; border-radius: 999px; border: 0; background: var(--navy); color: #fff; cursor: pointer; }
      @media print {
        body { background: #fff; padding: 0; }
        .no-print { display: none; }
        .grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .card { break-inside: avoid; border-width: 1px; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Códigos QR de prueba · Milimap</h1>
      <p class="lede">
        Cada tarjeta es un QR apuntando a un punto real del grafo de la Sede Calle 100.
        Sirven para probar la herramienta antes de imprimir los stickers del campus.
      </p>
      <ol class="no-print">
        <li>Abrí Milimap en el celular (o instalala como PWA).</li>
        <li>Entrá a <strong>Escanear QR</strong> y apuntá la cámara al código de esta pantalla.</li>
        <li>Confirmá la ubicación y pedí una ruta a otro salón.</li>
      </ol>
      <p class="meta">
        ${entries.length} códigos · ${baseUrl ? `URL base: ${escapeHtml(baseUrl)}` : 'payload directo (MILIMAP:v1:…)'} ·
        generado el ${date} con <code>npm run gen:qr</code>.
      </p>
      <p class="no-print"><button type="button" onclick="window.print()">Imprimir hoja</button></p>
    </header>
    <main class="grid">${cards}
    </main>
  </body>
</html>
`
}

function renderCsv(entries: readonly Entry[]): string {
  const header = 'codigo,piso,edificio,punto,punto_qr,archivo,payload'
  const rows = entries.map((entry) => {
    const file = `qr-${slugify(`${entry.floor.levelShort}-${entry.node.qrKey}`)}.png`
    const cells = [
      slugify(`${entry.floor.levelShort}-${entry.node.qrKey}`),
      entry.floor.levelShort,
      calle100Campus.building.name,
      entry.name,
      entry.node.qrKey ?? '',
      file,
      entry.payload,
    ]
    return cells.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
  })
  return [header, ...rows].join('\n') + '\n'
}

function renderReadme(entries: readonly Entry[], baseUrl: string | null): string {
  return `# Códigos QR de prueba

Generado por \`npm run gen:qr\`. **No editar a mano**: se borra en cada ejecución.

- ${entries.length} códigos, uno por punto del grafo de la Sede Calle 100.
- \`index.html\`: hoja imprimible con todos los códigos (abrir en el navegador).
- \`codigos.csv\`: la misma lista en tabla, para imprimir por lotes o cruzar con el inventario.
- \`qr-<piso>-<punto>.png\`: un archivo por código, 512×512 px.

## Cómo probarlos

1. \`npm run dev\` (o la URL del despliegue en GitHub Pages).
2. En el celular: abrir Milimap, ir a **Escanear QR**.
3. Apuntar la cámara al código de \`public/qrs/index.html\` en otra pantalla.
4. Confirmar la ubicación y buscar un destino en otro piso.

## Payload

${baseUrl ? `Los códigos contienen una URL completa con base \`${baseUrl}\`, así que también funcionan con la cámara nativa del teléfono.` : 'Los códigos contienen el payload directo (`MILIMAP:v1:<edificio>:<piso>:<punto>`), que funciona con el escáner de la app sin depender del dominio de despliegue.'}

Para generar códigos con URL (cámara nativa del teléfono):

\`\`\`bash
npm run gen:qr -- --base-url=https://usuario.github.io/milimap/
\`\`\`
`
}

async function main(): Promise<void> {
  const baseUrl = parseBaseUrl(process.argv.slice(2))
  const entries = buildEntries(baseUrl)
  if (entries.length === 0) throw new Error('No hay códigos que generar')

  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_DIR, { recursive: true })

  await Promise.all(
    entries.map((entry) =>
      toBuffer(entry.payload, {
        type: 'png',
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#112358ff', light: '#ffffffff' },
      }).then((buffer) =>
        writeFileSync(
          resolve(OUT_DIR, `qr-${slugify(`${entry.floor.levelShort}-${entry.node.qrKey}`)}.png`),
          buffer,
        ),
      ),
    ),
  )

  writeFileSync(resolve(OUT_DIR, 'index.html'), renderGallery(entries, baseUrl), 'utf8')
  writeFileSync(resolve(OUT_DIR, 'codigos.csv'), renderCsv(entries), 'utf8')
  writeFileSync(resolve(OUT_DIR, 'README.md'), renderReadme(entries, baseUrl), 'utf8')

  const perFloor = new Map<string, number>()
  for (const entry of entries) {
    perFloor.set(entry.floor.levelShort, (perFloor.get(entry.floor.levelShort) ?? 0) + 1)
  }

  console.log(`\nMilimap — códigos QR de prueba\n`)
  console.log(`  ${entries.length} códigos escritos en public/qrs/`)
  console.log(
    `  ${[...perFloor.entries()].map(([floor, count]) => `${floor}: ${count}`).join(' · ')}`,
  )
  console.log(`  Hoja de prueba: public/qrs/index.html`)
  console.log(`\n  ${baseUrl ? `URL base: ${baseUrl}` : 'Payload directo MILIMAP:v1:…'}\n`)
}

await main()
