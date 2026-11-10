/**
 * Demo schedule catalog (Phase 6).
 *
 * Placeholder programs/groups/classes that reference the demo campus rooms, so
 * "Mi horario" can be exercised before the university publishes the real term
 * catalog. Replaced in Phase 7 by versioned, public schedule JSON files.
 */

import type { ScheduleClass } from '@/content/types'
import type { SpaceId } from '@/domain/types'

export interface Program {
  id: string
  name: string
  groups: string[]
}

interface ClassSpec {
  code: string
  subject: string
  teacher: string
  spaceId: SpaceId
  weekday: number
  startsAt: string
  endsAt: string
}

interface ProgramSpec extends Program {
  classes: ClassSpec[]
}

const TERM_ID = '2026-2'

const PROGRAMS: Record<string, ProgramSpec> = {
  'ing-sistemas': {
    id: 'ing-sistemas',
    name: 'Ingeniería de Sistemas',
    groups: ['A', 'B'],
    classes: [
      {
        code: 'SIS-101',
        subject: 'Programación I',
        teacher: 'Dr. Pérez',
        spaceId: 'A101',
        weekday: 1,
        startsAt: '07:00',
        endsAt: '08:50',
      },
      {
        code: 'SIS-102',
        subject: 'Cálculo I',
        teacher: 'Dr. Rojas',
        spaceId: 'A102',
        weekday: 1,
        startsAt: '09:00',
        endsAt: '10:50',
      },
      {
        code: 'SIS-103',
        subject: 'Física I',
        teacher: 'Dra. Gómez',
        spaceId: 'LABFIS',
        weekday: 2,
        startsAt: '07:00',
        endsAt: '09:50',
      },
      {
        code: 'SIS-104',
        subject: 'Inglés I',
        teacher: 'Prof. Silva',
        spaceId: 'A204',
        weekday: 3,
        startsAt: '10:00',
        endsAt: '11:50',
      },
      {
        code: 'SIS-105',
        subject: 'Álgebra Lineal',
        teacher: 'Dr. Rojas',
        spaceId: 'A103',
        weekday: 4,
        startsAt: '14:00',
        endsAt: '15:50',
      },
    ],
  },
  econ: {
    id: 'econ',
    name: 'Ciencias Económicas',
    groups: ['A', 'B'],
    classes: [
      {
        code: 'ECON-201',
        subject: 'Estadística I',
        teacher: 'Dr. Pérez',
        spaceId: 'A101',
        weekday: 1,
        startsAt: '10:00',
        endsAt: '11:50',
      },
      {
        code: 'ECON-202',
        subject: 'Microeconomía',
        teacher: 'Dra. Gómez',
        spaceId: 'A102',
        weekday: 2,
        startsAt: '08:00',
        endsAt: '09:50',
      },
      {
        code: 'ECON-203',
        subject: 'Contabilidad',
        teacher: 'Dr. Torres',
        spaceId: 'A205',
        weekday: 3,
        startsAt: '14:00',
        endsAt: '15:50',
      },
      {
        code: 'ECON-204',
        subject: 'Matemáticas',
        teacher: 'Dr. Rojas',
        spaceId: 'A103',
        weekday: 4,
        startsAt: '07:00',
        endsAt: '08:50',
      },
    ],
  },
}

/** All demo programs, in display order. */
export function demoPrograms(): Program[] {
  return Object.values(PROGRAMS).map(({ id, name, groups }) => ({ id, name, groups }))
}

export function demoProgram(id: string): Program | null {
  const program = PROGRAMS[id]
  return program ? { id: program.id, name: program.name, groups: program.groups } : null
}

/** The classes of a program+group, as a student would see them. */
export function scheduleFor(programId: string, groupId: string): ScheduleClass[] {
  const program = PROGRAMS[programId]
  if (!program) return []

  return program.classes.map((spec) => ({
    id: `${TERM_ID}-${spec.code}-${spec.spaceId}-${spec.weekday}-${spec.startsAt}`.toLowerCase(),
    termId: TERM_ID,
    code: spec.code,
    subject: spec.subject,
    teacher: spec.teacher,
    spaceId: spec.spaceId,
    weekday: spec.weekday,
    startsAt: spec.startsAt,
    endsAt: spec.endsAt,
    group: groupId,
  }))
}
