/**
 * "Mi horario" screen (Phase 6).
 *
 * The student builds their week with a form — day, start/end time, subject and
 * room — instead of picking a program from a catalog or importing JSON. The
 * current and next class are shown with a "cómo llegar" shortcut, and the week
 * can be edited or cleared at any time. Everything is saved on-device; the
 * student session is simulated, but it gates this screen.
 */

import { useId, useState, type FormEvent } from 'react'
import { bogotaClock, findCurrentClass, findNextClass, minutesUntil } from '@/schedule/current'
import {
  clearStudentSchedule,
  defaultStorage,
  loadStudentSchedule,
  saveStudentSchedule,
  type StudentClass,
  type StudentSchedule,
} from '@/schedule/student'
import { resolveRoom, roomOptions, type RoomOption } from '@/schedule/rooms'
import { recordScheduleSelection } from '@/backend/analytics'
import { useNow } from '@/ui/useNow'
import { WEEKDAY_LABEL } from '@/content/types'
import type { SpaceId } from '@/domain/types'

interface ScheduleScreenProps {
  onOpenRoute: (spaceId: SpaceId) => void
}

/** Days the form offers: Monday through Saturday, like the campus week. */
const WEEKDAYS = [1, 2, 3, 4, 5, 6] as const
const DEFAULT_START = '07:00'
const DEFAULT_END = '08:50'

/** The catalog is static, so the suggestions are computed once per module load. */
const ROOM_OPTIONS = roomOptions()

interface ClassDraft {
  weekday: number
  startsAt: string
  endsAt: string
  subject: string
  room: string
}

/** Current ISO timestamp. Kept at module scope so it is not called during render. */
function nowIso(): string {
  return new Date().toISOString()
}

function createClassId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `class-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function ScheduleScreen({ onOpenRoute }: ScheduleScreenProps) {
  const storage = defaultStorage()
  const [schedule, setSchedule] = useState<StudentSchedule | null>(() =>
    loadStudentSchedule(storage),
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const now = useNow()

  const classes = schedule?.classes ?? []
  const editing = classes.find((item) => item.id === editingId) ?? null
  const current = findCurrentClass(classes, now)
  const next = findNextClass(classes, now)
  const grouped = groupByWeekday(classes)

  const persist = (nextClasses: StudentClass[]): void => {
    const updated: StudentSchedule = {
      version: 2,
      classes: nextClasses,
      updatedAt: nowIso(),
    }
    saveStudentSchedule(storage, updated)
    setSchedule(updated)
  }

  const saveClass = (draft: ClassDraft): void => {
    const matched = resolveRoom(draft.room, ROOM_OPTIONS)
    const entry: StudentClass = {
      id: editing?.id ?? createClassId(),
      weekday: draft.weekday,
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      subject: draft.subject.trim(),
      room: matched?.name ?? draft.room.trim(),
      spaceId: matched?.id ?? null,
    }
    const nextClasses = editing
      ? classes.map((item) => (item.id === entry.id ? entry : item))
      : [...classes, entry]

    persist(nextClasses)
    setEditingId(null)
    recordScheduleSelection({ count: nextClasses.length, weekday: entry.weekday })
  }

  const removeClass = (classId: string): void => {
    persist(classes.filter((item) => item.id !== classId))
    if (editingId === classId) setEditingId(null)
  }

  const reset = (): void => {
    clearStudentSchedule(storage)
    setSchedule(null)
    setEditingId(null)
  }

  return (
    <>
      <section className="card card--brand">
        <p className="card__eyebrow">
          Mi horario
          {classes.length > 0
            ? ` · ${classes.length} ${classes.length === 1 ? 'clase' : 'clases'}`
            : ''}
        </p>
        <h1 className="card__title">
          {current
            ? 'Estás en clase'
            : next
              ? 'Próxima clase'
              : classes.length > 0
                ? 'Sin clases por ahora'
                : 'Arma tu horario'}
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
        {!current && !next && classes.length === 0 ? (
          <p className="card__body">
            Agrega tus clases con día, hora, materia y salón. Con el salón, Milimap te lleva desde
            donde estés hasta la puerta del aula.
          </p>
        ) : null}
        {!current && !next && classes.length > 0 ? (
          <p className="card__body">No tienes clases ahora. Abajo está tu semana completa.</p>
        ) : null}
      </section>

      <ClassForm
        key={editing?.id ?? 'new'}
        editing={editing}
        onSubmit={saveClass}
        onCancel={() => setEditingId(null)}
      />

      <section className="card">
        <h2 className="card__title">Tu horario semanal</h2>
        {classes.length === 0 ? (
          <p className="card__body">Todavía no agregaste clases. Usa el formulario de arriba.</p>
        ) : (
          <>
            {WEEKDAYS.map((weekday) => {
              const dayClasses = grouped[weekday] ?? []
              if (dayClasses.length === 0) return null
              return (
                <div key={weekday} className="schedule-day">
                  <p className="schedule-day__label">{WEEKDAY_LABEL[weekday]}</p>
                  <ul className="schedule-day__list">
                    {dayClasses.map((item) => (
                      <ScheduleRow
                        key={item.id}
                        item={item}
                        onOpenRoute={onOpenRoute}
                        onEdit={() => setEditingId(item.id)}
                        onRemove={() => removeClass(item.id)}
                      />
                    ))}
                  </ul>
                </div>
              )
            })}
            <button
              type="button"
              className="link-btn link-btn--danger"
              style={{ marginTop: 'var(--space-4)' }}
              onClick={reset}
            >
              Borrar todo el horario
            </button>
          </>
        )}
      </section>
    </>
  )
}

function ClassForm({
  editing,
  onSubmit,
  onCancel,
}: {
  editing: StudentClass | null
  onSubmit: (draft: ClassDraft) => void
  onCancel: () => void
}) {
  const roomListId = useId()
  const [weekday, setWeekday] = useState<number>(editing?.weekday ?? 1)
  const [startsAt, setStartsAt] = useState(editing?.startsAt ?? DEFAULT_START)
  const [endsAt, setEndsAt] = useState(editing?.endsAt ?? DEFAULT_END)
  const [subject, setSubject] = useState(editing?.subject ?? '')
  const [room, setRoom] = useState(editing?.room ?? '')
  const [error, setError] = useState<string | null>(null)

  const matched = resolveRoom(room, ROOM_OPTIONS)

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!subject.trim()) {
      setError('Escribe el nombre de la materia.')
      return
    }
    if (!room.trim()) {
      setError('Escribe el salón.')
      return
    }
    if (!startsAt || !endsAt || startsAt >= endsAt) {
      setError('La hora de fin debe ser mayor que la hora de inicio.')
      return
    }
    setError(null)
    onSubmit({ weekday, startsAt, endsAt, subject, room })
  }

  return (
    <section className="card">
      <h2 className="card__title">{editing ? 'Editar clase' : 'Agregar clase'}</h2>
      <form onSubmit={submit} noValidate>
        <label className="field">
          <span className="field__label">Día</span>
          <select
            className="field__input"
            value={weekday}
            onChange={(event) => setWeekday(Number(event.target.value))}
          >
            {WEEKDAYS.map((day) => (
              <option key={day} value={day}>
                {WEEKDAY_LABEL[day]}
              </option>
            ))}
          </select>
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field__label">Hora de inicio</span>
            <input
              className="field__input"
              type="time"
              step={300}
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Hora de fin</span>
            <input
              className="field__input"
              type="time"
              step={300}
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </label>
        </div>

        <label className="field">
          <span className="field__label">Materia</span>
          <input
            className="field__input"
            value={subject}
            placeholder="Cálculo diferencial"
            autoComplete="off"
            onChange={(event) => setSubject(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">Salón</span>
          <input
            className="field__input"
            value={room}
            list={roomListId}
            placeholder="Aula B 101"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setRoom(event.target.value)}
          />
          <datalist id={roomListId}>
            {ROOM_OPTIONS.map((option) => (
              <option key={option.id} value={option.name} />
            ))}
          </datalist>
        </label>

        <p className="muted">{describeRoom(room, matched)}</p>

        {error ? (
          <p className="auth__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="pill-row" style={{ marginTop: 'var(--space-3)' }}>
          <button type="submit" className="btn-primary">
            {editing ? 'Guardar cambios' : 'Agregar al horario'}
          </button>
          {editing ? (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}

function ScheduleRow({
  item,
  onOpenRoute,
  onEdit,
  onRemove,
}: {
  item: StudentClass
  onOpenRoute: (spaceId: SpaceId) => void
  onEdit: () => void
  onRemove: () => void
}) {
  const spaceId = item.spaceId

  return (
    <li className="schedule-row">
      <div className="schedule-row__main">
        <span>
          <span className="schedule-row__subject">
            {item.startsAt}–{item.endsAt} · {item.subject}
          </span>
          <span className="schedule-row__meta">{item.room}</span>
        </span>
      </div>
      <div className="schedule-row__actions">
        {spaceId ? (
          <button type="button" className="link-btn" onClick={() => onOpenRoute(spaceId)}>
            Cómo llegar
          </button>
        ) : null}
        <button type="button" className="link-btn" onClick={onEdit}>
          Editar
        </button>
        <button type="button" className="link-btn link-btn--danger" onClick={onRemove}>
          Eliminar
        </button>
      </div>
    </li>
  )
}

function ClassCard({
  item,
  kind,
  eta,
  onOpenRoute,
}: {
  item: StudentClass
  kind: 'current' | 'next'
  eta?: string
  onOpenRoute: (spaceId: SpaceId) => void
}) {
  const spaceId = item.spaceId

  return (
    <div className="class-card">
      <div className="class-card__head">
        <span className="class-card__kind">{kind === 'current' ? 'En curso' : 'Próxima'}</span>
        <span className="class-card__time">
          {item.startsAt}–{item.endsAt}
        </span>
      </div>
      <span className="class-card__subject">{item.subject}</span>
      <span className="class-card__meta">{item.room}</span>
      {eta ? <span className="class-card__eta">{eta}</span> : null}
      {spaceId ? (
        <button
          type="button"
          className="btn-secondary btn--sm"
          onClick={() => onOpenRoute(spaceId)}
        >
          Cómo llegar
        </button>
      ) : null}
    </div>
  )
}

/** Live hint under the room field: known room (with route) or free text. */
function describeRoom(value: string, matched: RoomOption | null): string {
  if (!value.trim()) return `${ROOM_OPTIONS.length} salones del campus aparecen como sugerencia.`
  if (matched) return `Ruta disponible hasta ${matched.name} (piso ${matched.level}).`
  return 'Ese salón no está en el mapa: se guarda el nombre, pero no habrá ruta.'
}

/** Human ETA for the "next class" card, respecting the week boundary. */
function describeEta(item: StudentClass, now: Date): string {
  if (item.weekday !== bogotaClock(now).weekday) {
    return `${WEEKDAY_LABEL[item.weekday]} · ${item.startsAt}`
  }
  const mins = minutesUntil(item, now)
  if (mins < 60) return `empieza en ${mins} min`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  return rest === 0 ? `empieza en ${hours} h` : `empieza en ${hours} h ${rest} min`
}

/** Group a class list by weekday (1..6). */
function groupByWeekday(classes: readonly StudentClass[]): Record<number, StudentClass[]> {
  const result: Record<number, StudentClass[]> = {}
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
