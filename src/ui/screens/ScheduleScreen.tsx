/**
 * "Mi horario" screen (Phase 6).
 *
 * First visit: pick a program and group from the catalog. Afterwards the current
 * and next class are shown with a "cómo llegar" shortcut, plus a weekly view
 * where the student can untick classes they don't take. Everything is saved
 * on-device; no account required.
 */

import { useRef, useState } from 'react'
import { demoProgram, demoPrograms, scheduleFor } from '@/schedule/demo'
import { bogotaClock, findCurrentClass, findNextClass, minutesUntil } from '@/schedule/current'
import {
  clearStudentSchedule,
  defaultStorage,
  exportStudentSchedule,
  importStudentSchedule,
  loadStudentSchedule,
  saveStudentSchedule,
  type StudentSchedule,
} from '@/schedule/student'
import { recordScheduleSelection } from '@/backend/analytics'
import { useNow } from '@/ui/useNow'
import { WEEKDAY_LABEL } from '@/content/types'
import type { ScheduleClass } from '@/content/types'
import type { SpaceId } from '@/domain/types'

interface ScheduleScreenProps {
  onOpenRoute: (spaceId: SpaceId) => void
}

function newSchedule(programId: string, groupId: string, classIds: string[]): StudentSchedule {
  return {
    version: 1,
    programId,
    groupId,
    selectedClassIds: classIds,
    updatedAt: nowIso(),
  }
}

/** Current ISO timestamp. Kept at module scope so it is not called during render. */
function nowIso(): string {
  return new Date().toISOString()
}

export function ScheduleScreen({ onOpenRoute }: ScheduleScreenProps) {
  const storage = defaultStorage()
  const [schedule, setSchedule] = useState<StudentSchedule | null>(() =>
    loadStudentSchedule(storage),
  )
  const now = useNow()

  if (!schedule) {
    return <ProgramPicker onSave={(next) => setSchedule(next)} />
  }

  const program = demoProgram(schedule.programId)
  const allClasses = scheduleFor(schedule.programId, schedule.groupId)
  const selected = allClasses.filter((item) => schedule.selectedClassIds.includes(item.id))
  const current = findCurrentClass(selected, now)
  const next = findNextClass(selected, now)

  const toggleClass = (classId: string): void => {
    const has = schedule.selectedClassIds.includes(classId)
    const nextIds = has
      ? schedule.selectedClassIds.filter((id) => id !== classId)
      : [...schedule.selectedClassIds, classId]
    const updated = { ...schedule, selectedClassIds: nextIds, updatedAt: nowIso() }
    saveStudentSchedule(storage, updated)
    setSchedule(updated)
  }

  const reset = (): void => {
    clearStudentSchedule(storage)
    setSchedule(null)
  }

  const exportFile = (): void => {
    const blob = new Blob([exportStudentSchedule(schedule)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'milimap-horario.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importFile = (file: File): void => {
    void file.text().then((text) => {
      const parsed = importStudentSchedule(text)
      if (parsed) {
        saveStudentSchedule(storage, parsed)
        setSchedule(parsed)
      }
    })
  }

  const grouped = groupByWeekday(selected)

  return (
    <>
      <section className="card card--brand">
        <p className="card__eyebrow">Mi horario · {program?.name ?? schedule.programId}</p>
        <h1 className="card__title">
          {current ? 'Estás en clase' : next ? 'Próxima clase' : 'Sin clases por ahora'}
        </h1>

        {current ? <ClassCard item={current} kind="current" onOpenRoute={onOpenRoute} /> : null}
        {next ? (
          <ClassCard
            item={next}
            kind="next"
            eta={describeEta(next, now)}
            onOpenRoute={onOpenRoute}
          />
        ) : null}
        {!current && !next ? (
          <p className="card__body">No tenés clases en tu horario. Agregá alguna abajo.</p>
        ) : null}
      </section>

      <section className="card">
        <h2 className="card__title">Horario semanal</h2>
        <p className="card__body">
          Grupo {schedule.groupId} · desmarcá las materias que no estás cursando.
        </p>
        {[1, 2, 3, 4, 5, 6].map((weekday) => {
          const dayClasses = grouped[weekday] ?? []
          if (dayClasses.length === 0) return null
          return (
            <div key={weekday} className="schedule-day">
              <p className="schedule-day__label">{WEEKDAY_LABEL[weekday]}</p>
              <ul className="schedule-day__list">
                {dayClasses.map((item) => (
                  <li key={item.id} className="schedule-row">
                    <label className="schedule-row__main">
                      <input
                        type="checkbox"
                        checked={schedule.selectedClassIds.includes(item.id)}
                        onChange={() => toggleClass(item.id)}
                      />
                      <span>
                        <span className="schedule-row__subject">
                          {item.startsAt}–{item.endsAt} · {item.subject}
                        </span>
                        <span className="schedule-row__meta">
                          {item.code} · {roomLabel(item.spaceId)}
                        </span>
                      </span>
                    </label>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => onOpenRoute(item.spaceId)}
                    >
                      Cómo llegar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </section>

      <section className="card card--muted">
        <h2 className="card__title">Tu horario</h2>
        <div className="stack">
          <button type="button" className="btn-secondary" onClick={exportFile}>
            Exportar (JSON)
          </button>
          <label className="btn-secondary" style={{ justifyContent: 'center' }}>
            Importar
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) importFile(file)
              }}
            />
          </label>
          <button type="button" className="btn-secondary" onClick={reset}>
            Cambiar programa
          </button>
        </div>
      </section>
    </>
  )
}

function ProgramPicker({ onSave }: { onSave: (schedule: StudentSchedule) => void }) {
  const storage = defaultStorage()
  const programs = demoPrograms()
  const [programId, setProgramId] = useState(programs[0]?.id ?? '')
  const [groupId, setGroupId] = useState(programs[0]?.groups[0] ?? '')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const program = demoProgram(programId)
  const groups = program?.groups ?? []
  const preview = scheduleFor(programId, groupId)

  const save = (): void => {
    const schedule = newSchedule(
      programId,
      groupId,
      preview.map((item) => item.id),
    )
    saveStudentSchedule(storage, schedule)
    recordScheduleSelection({ programId, groupId, count: preview.length })
    onSave(schedule)
  }

  const importFile = (file: File): void => {
    void file.text().then((text) => {
      const parsed = importStudentSchedule(text)
      if (parsed) onSave(parsed)
    })
  }

  return (
    <section className="card">
      <h1 className="card__title">Configurá tu horario</h1>
      <p className="card__body">
        Elegí tu programa y grupo. El horario se guarda en tu dispositivo; podés cambiarlo cuando
        quieras.
      </p>

      <label className="field">
        <span className="field__label">Programa</span>
        <select
          className="field__input"
          value={programId}
          onChange={(event) => {
            const next = event.target.value
            setProgramId(next)
            const nextGroups = demoProgram(next)?.groups ?? []
            setGroupId(nextGroups[0] ?? '')
          }}
        >
          {programs.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Grupo</span>
        <select
          className="field__input"
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
        >
          {groups.map((group) => (
            <option key={group} value={group}>
              Grupo {group}
            </option>
          ))}
        </select>
      </label>

      <p className="muted">{preview.length} materias en este grupo.</p>

      <div className="stack" style={{ marginTop: 'var(--space-3)' }}>
        <button
          type="button"
          className="btn-primary"
          disabled={preview.length === 0}
          onClick={save}
        >
          Usar este horario
        </button>
        <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
          Importar horario (JSON)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) importFile(file)
          }}
        />
      </div>
    </section>
  )
}

function ClassCard({
  item,
  kind,
  eta,
  onOpenRoute,
}: {
  item: ScheduleClass
  kind: 'current' | 'next'
  eta?: string
  onOpenRoute: (spaceId: SpaceId) => void
}) {
  return (
    <div className="class-card">
      <div className="class-card__head">
        <span className="class-card__kind">{kind === 'current' ? 'En curso' : 'Próxima'}</span>
        <span className="class-card__time">
          {item.startsAt}–{item.endsAt}
        </span>
      </div>
      <span className="class-card__subject">{item.subject}</span>
      <span className="class-card__meta">
        {item.code} · {roomLabel(item.spaceId)}
      </span>
      {eta ? <span className="class-card__eta">{eta}</span> : null}
      <button
        type="button"
        className="btn-secondary btn--sm"
        onClick={() => onOpenRoute(item.spaceId)}
      >
        Cómo llegar
      </button>
    </div>
  )
}

/** Human ETA for the "next class" card, respecting the week boundary. */
function describeEta(item: ScheduleClass, now: Date): string {
  const clock = bogotaClock(now)
  if (item.weekday !== clock.weekday) {
    return `${WEEKDAY_LABEL[item.weekday]} · ${item.startsAt}`
  }
  const mins = minutesUntil(item, now)
  if (mins < 60) return `empieza en ${mins} min`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  return rest === 0 ? `empieza en ${hours} h` : `empieza en ${hours} h ${rest} min`
}

/** Group a class list by weekday (1..6). */
function groupByWeekday(classes: readonly ScheduleClass[]): Record<number, ScheduleClass[]> {
  const result: Record<number, ScheduleClass[]> = {}
  for (const item of classes) {
    const list = result[item.weekday]
    if (list) list.push(item)
    else result[item.weekday] = [item]
  }
  for (const key of Object.keys(result)) {
    const weekday = Number(key)
    result[weekday]?.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  }
  return result
}

/** Room label from a space id. Falls back to the raw id (demo rooms use codes). */
function roomLabel(spaceId: SpaceId): string {
  return spaceId
}
