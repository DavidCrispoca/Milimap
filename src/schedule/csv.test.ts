import { describe, expect, it } from 'vitest'
import {
  SCHEDULE_CSV_TEMPLATE,
  findConflicts,
  minutesOf,
  parseScheduleCsv,
  parseWeekday,
  splitCsvLine,
} from './csv'

const KNOWN = new Set(['A101', 'A102', 'A103', 'BIB'])
const opts = { termId: '2026-2', knownSpaceIds: KNOWN }

const HEADER = 'codigo,materia,docente,salon,dia,inicio,fin,grupo'

describe('splitCsvLine', () => {
  it('splits plain rows', () => {
    expect(splitCsvLine('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('keeps commas inside quotes', () => {
    expect(splitCsvLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd'])
  })

  it('unescapes doubled quotes', () => {
    expect(splitCsvLine('a,"dijo ""hola""",c')).toEqual(['a', 'dijo "hola"', 'c'])
  })
})

describe('parseWeekday', () => {
  it('accepts numbers 1-6', () => {
    expect(parseWeekday('1')).toBe(1)
    expect(parseWeekday('6')).toBe(6)
  })

  it('accepts Spanish day names, with or without accents', () => {
    expect(parseWeekday('lunes')).toBe(1)
    expect(parseWeekday('Miércoles')).toBe(3)
    expect(parseWeekday('miercoles')).toBe(3)
  })

  it('rejects Sunday and nonsense', () => {
    expect(parseWeekday('0')).toBeNull()
    expect(parseWeekday('domingo')).toBeNull()
    expect(parseWeekday('lunesx')).toBeNull()
  })
})

describe('minutesOf', () => {
  it('converts HH:MM to minutes', () => {
    expect(minutesOf('08:00')).toBe(480)
    expect(minutesOf('09:50')).toBe(590)
  })
})

describe('parseScheduleCsv', () => {
  it('parses the template with no errors', () => {
    const result = parseScheduleCsv(SCHEDULE_CSV_TEMPLATE, opts)
    expect(result.errors).toEqual([])
    expect(result.classes).toHaveLength(3)
  })

  it('normalizes single-digit hours', () => {
    const csv = `${HEADER}\nX,Y,Z,A101,1,8:00,9:00,A`
    const result = parseScheduleCsv(csv, opts)
    expect(result.classes[0]?.startsAt).toBe('08:00')
  })

  it('rejects an unexpected header', () => {
    const result = parseScheduleCsv('a,b,c\n1,2,3', opts)
    expect(result.errors[0]?.message).toMatch(/Encabezado inesperado/)
  })

  it('rejects an empty file', () => {
    expect(parseScheduleCsv('   ', opts).errors[0]?.message).toMatch(/vacío/)
  })

  it('rejects a room that is not in the catalog', () => {
    const csv = `${HEADER}\nX,Y,Z,NOEXISTE,1,08:00,09:00,A`
    const result = parseScheduleCsv(csv, opts)
    expect(result.errors[0]?.message).toMatch(/no existe en el catálogo/)
  })

  it('rejects an invalid weekday', () => {
    const csv = `${HEADER}\nX,Y,Z,A101,9,08:00,09:00,A`
    expect(parseScheduleCsv(csv, opts).errors[0]?.message).toMatch(/Día inválido/)
  })

  it('rejects an invalid time', () => {
    const csv = `${HEADER}\nX,Y,Z,A101,1,25:00,09:00,A`
    expect(parseScheduleCsv(csv, opts).errors[0]?.message).toMatch(/Horario inválido/)
  })

  it('rejects a class that ends before it starts', () => {
    const csv = `${HEADER}\nX,Y,Z,A101,1,10:00,09:00,A`
    expect(parseScheduleCsv(csv, opts).errors[0]?.message).toMatch(/no puede ser posterior o igual/)
  })

  it('rejects a duplicated row', () => {
    const row = 'X,Y,Z,A101,1,08:00,09:00,A'
    const result = parseScheduleCsv(`${HEADER}\n${row}\n${row}`, opts)
    expect(result.classes).toHaveLength(1)
    expect(result.errors[0]?.message).toMatch(/repetida/)
  })

  it('rejects a row with the wrong column count', () => {
    const result = parseScheduleCsv(`${HEADER}\nX,Y,A101,1,08:00`, opts)
    expect(result.errors[0]?.message).toMatch(/Se esperaban/)
  })

  it('reports the correct line number for a bad row', () => {
    const csv = `${HEADER}\nA,B,C,A101,1,08:00,09:00,A\nD,E,F,A101,9,10:00,11:00,A`
    const result = parseScheduleCsv(csv, opts)
    expect(result.errors[0]?.line).toBe(3)
  })

  it('keeps valid rows when other rows fail', () => {
    const csv = `${HEADER}\nA,B,C,A101,1,08:00,09:00,A\nD,E,F,NOEXISTE,1,10:00,11:00,A`
    const result = parseScheduleCsv(csv, opts)
    expect(result.classes).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
  })

  it('tags every class with the term id', () => {
    const result = parseScheduleCsv(SCHEDULE_CSV_TEMPLATE, opts)
    for (const item of result.classes) expect(item.termId).toBe('2026-2')
  })
})

describe('findConflicts', () => {
  const base = {
    id: 'x',
    termId: '2026-2',
    code: 'C',
    teacher: 'T',
    group: 'A',
  }

  it('finds two classes overlapping in the same room', () => {
    const conflicts = findConflicts([
      {
        ...base,
        id: 'a',
        subject: 'Uno',
        spaceId: 'A101',
        weekday: 1,
        startsAt: '08:00',
        endsAt: '10:00',
      },
      {
        ...base,
        id: 'b',
        subject: 'Dos',
        spaceId: 'A101',
        weekday: 1,
        startsAt: '09:00',
        endsAt: '11:00',
      },
    ])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]?.message).toMatch(/A101/)
  })

  it('does not flag back-to-back classes', () => {
    const conflicts = findConflicts([
      {
        ...base,
        id: 'a',
        subject: 'Uno',
        spaceId: 'A101',
        weekday: 1,
        startsAt: '08:00',
        endsAt: '10:00',
      },
      {
        ...base,
        id: 'b',
        subject: 'Dos',
        spaceId: 'A101',
        weekday: 1,
        startsAt: '10:00',
        endsAt: '12:00',
      },
    ])
    expect(conflicts).toEqual([])
  })

  it('does not flag the same slot in different rooms', () => {
    const conflicts = findConflicts([
      {
        ...base,
        id: 'a',
        subject: 'Uno',
        spaceId: 'A101',
        weekday: 1,
        startsAt: '08:00',
        endsAt: '10:00',
      },
      {
        ...base,
        id: 'b',
        subject: 'Dos',
        spaceId: 'A102',
        weekday: 1,
        startsAt: '08:00',
        endsAt: '10:00',
      },
    ])
    expect(conflicts).toEqual([])
  })

  it('does not flag the same room on a different day', () => {
    const conflicts = findConflicts([
      {
        ...base,
        id: 'a',
        subject: 'Uno',
        spaceId: 'A101',
        weekday: 1,
        startsAt: '08:00',
        endsAt: '10:00',
      },
      {
        ...base,
        id: 'b',
        subject: 'Dos',
        spaceId: 'A101',
        weekday: 2,
        startsAt: '08:00',
        endsAt: '10:00',
      },
    ])
    expect(conflicts).toEqual([])
  })

  it('flags one class fully containing another', () => {
    const conflicts = findConflicts([
      {
        ...base,
        id: 'a',
        subject: 'Largo',
        spaceId: 'A101',
        weekday: 3,
        startsAt: '08:00',
        endsAt: '14:00',
      },
      {
        ...base,
        id: 'b',
        subject: 'Corto',
        spaceId: 'A101',
        weekday: 3,
        startsAt: '09:00',
        endsAt: '10:00',
      },
    ])
    expect(conflicts).toHaveLength(1)
  })
})
