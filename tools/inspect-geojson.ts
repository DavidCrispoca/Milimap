/**
 * Inspect a GeoJSON file produced by the team before it becomes map data.
 *
 * This is the quality gate between "someone traced a hand-drawn plan" and "the
 * importer can consume it". It does not import anything: it tells the author
 * what is wrong while they still have the file open.
 *
 * Usage:
 *   npm run inspect:geojson -- src/data/inbox/edificio-a/p1.geojson
 *
 * Exit code 1 means errors: the file must be fixed before delivery.
 */

import { readFileSync } from 'node:fs'
import { polygonArea } from '../src/domain/geometry'
import type { LocalPoint } from '../src/domain/types'

interface GeoFeature {
  type: 'Feature'
  properties?: Record<string, unknown>
  geometry?: { type: string; coordinates: unknown }
}

interface GeoCollection {
  type: 'FeatureCollection'
  features?: GeoFeature[]
}

type Layer = 'espacios' | 'pasillos' | 'verticales'

const KNOWN_LAYERS: Layer[] = ['espacios', 'pasillos', 'verticales']

interface Problem {
  severity: 'error' | 'warning'
  message: string
}

const problems: Problem[] = []
const addProblem = (severity: Problem['severity'], message: string): void => {
  problems.push({ severity, message })
}

/** Read the outer ring of a Polygon or MultiPolygon. */
function outerRing(geometry: GeoFeature['geometry']): LocalPoint[] | null {
  if (!geometry) return null
  const coords = geometry.coordinates

  if (geometry.type === 'Polygon' && Array.isArray(coords)) {
    const ring = coords[0]
    if (!Array.isArray(ring)) return null
    return toPoints(ring)
  }

  if (geometry.type === 'MultiPolygon' && Array.isArray(coords)) {
    const first = coords[0]
    if (!Array.isArray(first)) return null
    const ring = first[0]
    if (!Array.isArray(ring)) return null
    return toPoints(ring)
  }

  return null
}

function toPoints(ring: unknown[]): LocalPoint[] {
  const points: LocalPoint[] = []
  for (const entry of ring) {
    if (!Array.isArray(entry)) continue
    const [x, y] = entry
    if (typeof x !== 'number' || typeof y !== 'number') continue
    points.push({ x, y })
  }
  return points
}

function pointCoordinate(geometry: GeoFeature['geometry']): LocalPoint | null {
  if (!geometry || geometry.type !== 'Point') return null
  const coords = geometry.coordinates
  if (!Array.isArray(coords)) return null
  const [x, y] = coords
  if (typeof x !== 'number' || typeof y !== 'number') return null
  return { x, y }
}

/**
 * Heuristic for the coordinate system.
 *
 * Local metre grids are usually authored with round numbers or a handful of
 * decimals, and they can exceed the geographic ranges. WGS84 coordinates are
 * small (|x| <= 180, |y| <= 90) and practically never whole numbers at
 * building scale, because they carry ~6 decimals.
 */
function detectUnits(points: LocalPoint[]): 'WGS84' | 'metros locales' | 'indeterminado' {
  if (points.length === 0) return 'indeterminado'

  const integers = points.filter((p) => Number.isInteger(p.x) && Number.isInteger(p.y)).length
  if (integers / points.length > 0.6) return 'metros locales'

  const inGeoRange = points.every((p) => Math.abs(p.x) <= 180 && Math.abs(p.y) <= 90)
  if (!inGeoRange) return 'metros locales'

  const fractional = points.filter((p) => !Number.isInteger(p.x) || !Number.isInteger(p.y)).length
  return fractional / points.length > 0.9 ? 'WGS84' : 'indeterminado'
}

function main(): void {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Uso: npm run inspect:geojson -- <ruta-al-archivo.geojson>')
    process.exit(2)
  }

  let raw: string
  try {
    raw = readFileSync(filePath, 'utf8')
  } catch {
    console.error(`No se pudo leer el archivo: ${filePath}`)
    process.exit(2)
  }

  let collection: GeoCollection
  try {
    collection = JSON.parse(raw) as GeoCollection
  } catch (error) {
    console.error(`El archivo no es JSON válido: ${(error as Error).message}`)
    process.exit(1)
  }

  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    console.error('El archivo debe ser un GeoJSON "FeatureCollection" con un arreglo "features".')
    process.exit(1)
  }

  const features = collection.features
  const byLayer = new Map<string, GeoFeature[]>()

  for (const feature of features) {
    const layer = String(feature.properties?.layer ?? '').trim()
    if (!layer) {
      addProblem('error', 'Hay una feature sin la propiedad "layer".')
      continue
    }
    if (!KNOWN_LAYERS.includes(layer as Layer)) {
      addProblem(
        'error',
        `La capa "${layer}" no se reconoce. Usá: espacios, pasillos o verticales.`,
      )
      continue
    }
    const list = byLayer.get(layer) ?? []
    list.push(feature)
    byLayer.set(layer, list)
  }

  console.log(`\nMilimap — inspección de GeoJSON\n`)
  console.log(`  Archivo: ${filePath}`)
  console.log(`  Features: ${features.length}\n`)

  const allPoints: LocalPoint[] = []

  // --- espacios y pasillos -------------------------------------------
  for (const layer of ['espacios', 'pasillos'] as const) {
    const layerFeatures = byLayer.get(layer) ?? []
    if (layerFeatures.length === 0) {
      if (layer === 'espacios') addProblem('warning', 'No hay ninguna feature en "espacios".')
      continue
    }

    console.log(`  ${layer.toUpperCase()} (${layerFeatures.length})`)
    let totalArea = 0

    for (const feature of layerFeatures) {
      const props = feature.properties ?? {}
      const label = String(props.name ?? props.id ?? '(sin nombre)')
      const ring = outerRing(feature.geometry)
      const geometryType = feature.geometry?.type ?? 'null'

      if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
        addProblem('error', `${layer}: "${label}" no es un polígono (es ${geometryType}).`)
        continue
      }

      if (!ring || ring.length < 3) {
        addProblem('error', `${layer}: "${label}" tiene menos de 3 puntos.`)
        continue
      }

      allPoints.push(...ring)
      const area = polygonArea(ring)
      totalArea += area

      const issues: string[] = []
      if (!props.id) issues.push('sin id')
      if (!props.name) issues.push('sin name')
      if (area < 0.5) issues.push('área casi nula')

      const suffix = issues.length > 0 ? `  ← ${issues.join(', ')}` : ''
      console.log(`    · ${label.padEnd(26)} ${area.toFixed(1)} m²${suffix}`)

      if (area < 0.5) {
        addProblem('error', `${layer}: "${label}" tiene área casi nula (${area.toFixed(2)} m²).`)
      }
      if (!props.id) {
        addProblem('warning', `${layer}: "${label}" no tiene "id"; se generará uno automático.`)
      }
      if (!props.name) {
        addProblem('warning', `${layer}: "${label}" no tiene "name"; se completa después.`)
      }
    }

    console.log(`    Total: ${totalArea.toFixed(1)} m²\n`)
  }

  // --- verticales -----------------------------------------------------
  const verticals = byLayer.get('verticales') ?? []
  if (verticals.length > 0) {
    console.log(`  VERTICALES (${verticals.length})`)
    for (const feature of verticals) {
      const props = feature.properties ?? {}
      const code = String(props.code ?? '').trim()
      const kind = String(props.type ?? '').trim()
      const point = pointCoordinate(feature.geometry)

      if (!point) {
        addProblem('error', `verticales: "${code || '(sin código)'}" no es un Point.`)
        continue
      }
      if (!code) {
        addProblem('error', 'verticales: hay un punto sin "code" (ESC-A, ASC-A…).')
      }
      if (!kind) {
        addProblem('warning', `verticales: "${code}" no tiene "type" (stairs/elevator/ramp).`)
      }
      allPoints.push(point)
      console.log(`    · ${code.padEnd(10)} ${kind || '(sin tipo)'}`)
    }
    console.log('')
  } else {
    addProblem('warning', 'No hay "verticales": no se podrá cambiar de piso.')
  }

  // --- unidades y bbox ------------------------------------------------
  if (allPoints.length > 0) {
    const xs = allPoints.map((p) => p.x)
    const ys = allPoints.map((p) => p.y)
    const width = Math.max(...xs) - Math.min(...xs)
    const height = Math.max(...ys) - Math.min(...ys)

    const units = detectUnits(allPoints)
    console.log(`  Unidades detectadas: ${units}`)

    if (units === 'metros locales') {
      console.log(`  Huella aproximada: ${width.toFixed(1)} m × ${height.toFixed(1)} m`)
      if (width > 300 || height > 300) {
        addProblem(
          'warning',
          `La huella mide ${width.toFixed(0)} × ${height.toFixed(0)} m. Un edificio de campus rara vez pasa de 150 m: revisá la escala.`,
        )
      }
    } else if (units === 'WGS84') {
      console.log('  Coordenadas geográficas: se normalizan a metros en la importación.')
      console.log(`  Extensión: ${width.toFixed(6)}° × ${height.toFixed(6)}°`)
    } else {
      console.log(
        '  No se pudo determinar el sistema. Si son metros locales, usá números redondos;' +
          ' si son grados, exportá en EPSG:4326.',
      )
    }
    console.log('')
  }

  // --- resumen --------------------------------------------------------
  const errors = problems.filter((problem) => problem.severity === 'error')
  const warnings = problems.filter((problem) => problem.severity === 'warning')

  if (problems.length > 0) {
    console.log('  Observaciones:')
    for (const problem of problems) {
      const tag = problem.severity === 'error' ? 'ERROR  ' : 'WARNING'
      console.log(`    ${tag}  ${problem.message}`)
    }
    console.log('')
  }

  console.log(`  Resumen: ${errors.length} error(es), ${warnings.length} advertencia(s).\n`)

  if (errors.length > 0) {
    console.error('Archivo con errores: corregilo antes de entregarlo.\n')
    process.exit(1)
  }

  console.log('Archivo listo para importar.\n')
}

main()
