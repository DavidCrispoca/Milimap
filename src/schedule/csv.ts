/**
 * Schedule CSV import and conflict detection.
 *
 * Pure functions, no React and no I/O: this is the part that must be correct and
 * testable, because a wrong schedule sends a student to the wrong classroom.
 *
 * The CSV the university sends is simple on purpose. Anything more elaborate
 * (merged cells, two rooms per class) gets rejected with a clear message instead
 * of being guessed at.
 */

import type { ScheduleClass } from '@/content/types'

export interface CsvError {
  /** 1-based line number in the original file, including the header. */
  line: number
  message: string
}

export interface CsvParseResult {
  classes: ScheduleClass[]
  errors: CsvError[]
}

export interface Conflict {
  a: ScheduleClass
  b: ScheduleClass
  message: string
}

const EXPECTED_HEADER = ['codigo', 'materia', 'docente', 'salon', 'dia', 'inicio', 'fin', 'grupo']

const WEEKDAY_NAMES: Record<string, number> = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
}

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/

/** Split one CSV line, honouring double quotes. */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current.trim())
  return cells
}

/** Parse a weekday cell: accepts "1".."6" or the Spanish day name. */
export function parseWeekday(raw: string): number | null {
  const value = raw.trim().toLowerCase()
  if (/^[1-6]$/.test(value)) return Number(value)

  const byName = WEEKDAY_NAMES[value]
  if (byName !== undefined) return byName

  return null
}

/** Compares "HH:MM" strings; they sort lexicographically once zero-padded. */
export function minutesOf(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':')
  return Number(hours) * 60 + Number(minutes)
}

function padTime(value: string): string | null {
  const match = TIME_PATTERN.exec(value.trim())
  if (!match) return null
  const hours = String(Number(match[1])).padStart(2, '0')
  const minutes = match[2] ?? '00'
  return `${hours}:${minutes}`
}

export interface ParseOptions {
  termId: string
  /** Known space ids, to catch a typo in the room column before it reaches data. */
  knownSpaceIds: ReadonlySet<string>
}

/** Parse the whole file. Errors are collected per line so one typo does not hide the rest. */
export function parseScheduleCsv(text: string, options: ParseOptions): CsvParseResult {
  const classes: ScheduleClass[] = []
  const errors: CsvError[] = []

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    return { classes: [], errors: [{ line: 0, message: 'El archivo está vacío.' }] }
  }

  const header = splitCsvLine(lines[0] ?? '').map((cell) => cell.toLowerCase())
  const headerMatches = EXPECTED_HEADER.every((name, index) => header[index] === name)
  if (!headerMatches) {
    return {
      classes: [],
      errors: [
        {
          line: 1,
          message: `Encabezado inesperado. Debe ser: ${EXPECTED_HEADER.join(',')}`,
        },
      ],
    }
  }

  const seen = new Set<string>()

  for (let i = 1; i < lines.length; i += 1) {
    const lineNumber = i + 1
    const cells = splitCsvLine(lines[i] ?? '')

    if (cells.length !== EXPECTED_HEADER.length) {
      errors.push({
        line: lineNumber,
        message: `Se esperaban ${EXPECTED_HEADER.length} columnas y llegaron ${cells.length}.`,
      })
      continue
    }

    const cell = (index: number): string => cells[index] ?? ''
    const code = cell(0)
    const subject = cell(1)
    const teacher = cell(2)
    const room = cell(3)
    const weekdayRaw = cell(4)
    const startRaw = cell(5)
    const endRaw = cell(6)
    const group = cell(7)

    if (!subject) {
      errors.push({ line: lineNumber, message: 'La columna "materia" está vacía.' })
      continue
    }
    if (!room) {
      errors.push({ line: lineNumber, message: 'La columna "salon" está vacía.' })
      continue
    }
    if (!options.knownSpaceIds.has(room)) {
      errors.push({
        line: lineNumber,
        message: `El salón "${room}" no existe en el catálogo. Revisá el código o cargalo antes.`,
      })
      continue
    }

    const weekday = parseWeekday(weekdayRaw)
    if (weekday === null) {
      errors.push({
        line: lineNumber,
        message: `Día inválido "${weekdayRaw}". Usá 1-6 o el nombre del día.`,
      })
      continue
    }

    const startsAt = padTime(startRaw)
    const endsAt = padTime(endRaw)
    if (!startsAt || !endsAt) {
      errors.push({
        line: lineNumber,
        message: `Horario inválido "${startRaw}"–"${endRaw}". Formato esperado HH:MM.`,
      })
      continue
    }

    if (minutesOf(startsAt) >= minutesOf(endsAt)) {
      errors.push({
        line: lineNumber,
        message: `La hora de inicio (${startsAt}) no puede ser posterior o igual a la de fin (${endsAt}).`,
      })
      continue
    }

    const id = `${options.termId}-${code}-${room}-${weekday}-${startsAt}`.toLowerCase()
    if (seen.has(id)) {
      errors.push({ line: lineNumber, message: 'La fila está repetida en el mismo archivo.' })
      continue
    }
    seen.add(id)

    classes.push({
      id,
      termId: options.termId,
      code,
      subject,
      teacher,
      spaceId: room,
      weekday,
      startsAt,
      endsAt,
      group,
    })
  }

  return { classes, errors }
}

/**
 * Find impossible schedules: the same room with two classes at overlapping times.
 *
 * This is the check that saves a semester. Without it, the app would happily send
 * a student to a classroom that is occupied by another group.
 */
export function findConflicts(classes: readonly ScheduleClass[]): Conflict[] {
  const conflicts: Conflict[] = []

  const byRoomDay = new Map<string, ScheduleClass[]>()
  for (const item of classes) {
    const key = `${item.spaceId}|${item.weekday}`
    const list = byRoomDay.get(key)
    if (list) list.push(item)
    else byRoomDay.set(key, [item])
  }

  for (const [key, list] of byRoomDay) {
    const sorted = [...list].sort((a, b) => minutesOf(a.startsAt) - minutesOf(b.startsAt))

    for (let i = 1; i < sorted.length; i += 1) {
      const previous = sorted[i - 1]
      const current = sorted[i]
      if (!previous || !current) continue

      if (minutesOf(current.startsAt) < minutesOf(previous.endsAt)) {
        const [room, day] = key.split('|')
        conflicts.push({
          a: previous,
          b: current,
          message: `El salón ${room} tiene dos clases superpuestas el día ${day}: ${previous.startsAt}–${previous.endsAt} (${previous.subject}) y ${current.startsAt}–${current.endsAt} (${current.subject}).`,
        })
      }
    }
  }

  return conflicts
}

/** Example file shown in the admin UI, so nobody has to guess the format. */
export const SCHEDULE_CSV_TEMPLATE = `codigo,materia,docente,salon,dia,inicio,fin,grupo
ECON-201,Estadística I,Dr. Pérez,A101,1,08:00,09:50,A
ECON-202,Microeconomía,Dra. Gómez,A102,1,10:00,11:50,A
MAT-101,Cálculo I,Dr. Rojas,A103,2,08:00,09:50,B`
