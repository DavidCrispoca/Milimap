/**
 * CLI validator for floor plan data.
 *
 * Runs the exact same `validateCampus` used by the admin editor (Phase 3) and by
 * the tests, so "valid" means one thing everywhere.
 *
 * Usage:
 *   npm run validate:plans
 *
 * Exit codes: 0 = no errors, 1 = at least one error. CI depends on this.
 */

import { calle100Campus, demoCampus } from '../src/data/index'
import { buildGraphIndex, type Campus } from '../src/domain/routing'
import { summarize, validateCampus, type ValidationIssue } from '../src/domain/validate'

const SEVERITY_LABEL: Record<ValidationIssue['severity'], string> = {
  error: 'ERROR  ',
  warning: 'WARNING',
  info: 'INFO   ',
}

function printReport(campusName: string, issues: ValidationIssue[], stats: Stats): void {
  console.log(`\nMilimap — validación de planos: ${campusName}\n`)

  console.log(
    `  Pisos: ${stats.floors} · Espacios: ${stats.spaces} · Pasillos: ${stats.walkways} · ` +
      `Nodos: ${stats.nodes} · Aristas: ${stats.edges} · Transiciones: ${stats.transitions}`,
  )

  if (issues.length === 0) {
    console.log('\n  Sin observaciones. El grafo es coherente.\n')
    return
  }

  console.log('')

  // Errors first: they are what blocks a merge.
  const order: Array<ValidationIssue['severity']> = ['error', 'warning', 'info']
  const sorted = [...issues].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity))

  for (const issue of sorted) {
    const ref = issue.ref ? ` [${issue.ref}]` : ''
    console.log(`  ${SEVERITY_LABEL[issue.severity]}  ${issue.message}${ref}`)
  }

  const summary = summarize(issues)
  console.log(
    `\n  Resumen: ${summary.errors} error(es), ${summary.warnings} advertencia(s), ${summary.infos} info.\n`,
  )
}

interface Stats {
  floors: number
  spaces: number
  walkways: number
  nodes: number
  edges: number
  transitions: number
}

function collectStats(campus: Campus): Stats {
  let spaces = 0
  let walkways = 0
  let nodes = 0
  let edges = 0
  let transitions = 0

  for (const floor of campus.floors) {
    spaces += floor.spaces.length
    walkways += floor.walkways.length
    nodes += floor.nodes.length
    edges += floor.edges.length
    transitions += floor.transitions.length
  }

  return { floors: campus.floors.length, spaces, walkways, nodes, edges, transitions }
}

function validateSingleCampus(campus: Campus): boolean {
  const issues = validateCampus(campus)
  const stats = collectStats(campus)

  printReport(`${campus.building.name} (${campus.building.id})`, issues, stats)

  const index = buildGraphIndex(campus)
  console.log(`  Índice de ruteo: ${index.nodes.size} nodos alcanzables por el motor.\n`)

  const summary = summarize(issues)
  return summary.ok
}

function main(): void {
  const okDemo = validateSingleCampus(demoCampus)
  const okCalle100 = validateSingleCampus(calle100Campus)

  if (!okDemo || !okCalle100) {
    console.error('Validación fallida: corrige los errores antes de publicar.\n')
    process.exit(1)
  }

  console.log('Validación OK para todos los campus.\n')
}

main()
