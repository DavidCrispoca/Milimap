/**
 * Home screen.
 *
 * Phase 2: announcements and events come from the content store, so anything an
 * administrator publishes appears here. "Cómo llegar" opens the map tab with the
 * event's place as destination.
 */

import { useContentStore } from '@/content/store'
import { useNow } from '@/ui/useNow'
import { mergedCatalog } from '@/content/catalog'
import { activeAnnouncements, sortForCarousel, upcomingEvents } from '@/content/selectors'
import { EVENT_CATEGORY_LABEL, ANNOUNCEMENT_KIND_LABEL } from '@/content/types'
import { demoCatalog } from '@/data'
import { defaultStorage, loadStudentSchedule } from '@/schedule/student'
import { demoProgram, scheduleFor } from '@/schedule/demo'
import { findCurrentClass, findNextClass } from '@/schedule/current'
import { useState } from 'react'
import type { SpaceId } from '@/domain/types'

const PHASE_STEPS = [
  { label: 'Fase 0 · Cimientos y tooling', state: 'done' as const },
  { label: 'Fase 1 · Motor de ruteo', state: 'done' as const },
  { label: 'Fase 2 · Panel de administración', state: 'done' as const },
  { label: 'Fase 5 · Escáner QR', state: 'done' as const },
  { label: 'Fase 6 · Mi horario', state: 'done' as const },
  { label: 'Fase 8 · PWA y offline', state: 'next' as const },
  { label: 'Fases 3-4-7 · Mapa y digitalización', state: 'todo' as const },
]

const DOT: Record<'done' | 'next' | 'todo', { className: string; glyph: string }> = {
  done: { className: 'status-list__dot status-list__dot--done', glyph: '✓' },
  next: { className: 'status-list__dot status-list__dot--next', glyph: '→' },
  todo: { className: 'status-list__dot status-list__dot--todo', glyph: '·' },
}

const DATE_FORMAT = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const ANNOUNCEMENT_CLASS = {
  info: 'alert alert--info',
  warning: 'alert alert--warning',
  emergency: 'alert alert--danger',
} as const

export function HomeScreen({
  onOpenRoute,
  onOpenScanner,
  onOpenSchedule,
}: {
  onOpenRoute: (spaceId: SpaceId) => void
  onOpenScanner: () => void
  onOpenSchedule: () => void
}) {
  const events = useContentStore((state) => state.events)
  const announcements = useContentStore((state) => state.announcements)
  const spaceEdits = useContentStore((state) => state.spaceEdits)

  const [schedule] = useState(() => loadStudentSchedule(defaultStorage()))
  const now = useNow()
  const catalog = mergedCatalog(demoCatalog, spaceEdits)
  const roomName = (id: string | null): string =>
    id ? (catalog.find((entry) => entry.id === id)?.name ?? id) : 'Lugar por confirmar'

  const live = activeAnnouncements(announcements, now)
  const featured = sortForCarousel(upcomingEvents(events, now)).slice(0, 4)

  const myClasses = schedule
    ? scheduleFor(schedule.programId, schedule.groupId).filter((item) =>
        schedule.selectedClassIds.includes(item.id),
      )
    : []
  const currentClass = findCurrentClass(myClasses, now)
  const nextClass = findNextClass(myClasses, now)
  const programName = schedule
    ? (demoProgram(schedule.programId)?.name ?? schedule.programId)
    : null

  return (
    <>
      {live.map((item) => (
        <section key={item.id} className={ANNOUNCEMENT_CLASS[item.kind]} role="status">
          <div>
            <strong>{ANNOUNCEMENT_KIND_LABEL[item.kind]}</strong>
            <p style={{ margin: 0 }}>{item.message}</p>
          </div>
        </section>
      ))}

      <section className="card card--brand">
        <p className="card__eyebrow">Campus activo</p>
        <h1 className="card__title">Sede Calle 100</h1>
        <p className="card__body">
          Carrera 11 # 101-80, Bogotá D.C. · Navegación indoor dentro de la institución.
        </p>
        <div className="pill-row">
          <span className="pill pill--brand">2D cenital</span>
          <span className="pill pill--brand">Rutas por piso</span>
          <span className="pill pill--brand">Acceso por QR</span>
        </div>
      </section>

      <section className="card">
        <p className="card__eyebrow">Eventos especiales</p>
        <h2 className="card__title">Próximamente en la universidad</h2>
        {featured.length === 0 ? (
          <p className="card__body">No hay eventos programados por ahora.</p>
        ) : (
          <ul className="event-list">
            {featured.map((event) => (
              <li key={event.id} className="event">
                <div className="event__date" aria-hidden="true">
                  {DATE_FORMAT.format(new Date(event.startsAt))}
                </div>
                <div className="event__body">
                  <span className="event__title">{event.title}</span>
                  <span className="event__meta">
                    {EVENT_CATEGORY_LABEL[event.category]} · {roomName(event.spaceId)}
                  </span>
                  <span className="event__desc">{event.description}</span>
                  {event.spaceId ? (
                    <button
                      type="button"
                      className="btn-secondary btn--sm"
                      onClick={() => onOpenRoute(event.spaceId as SpaceId)}
                    >
                      Cómo llegar
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="card__title">Mi horario</h2>
        {!schedule ? (
          <>
            <p className="card__body">
              Configurá tu horario del semestre y entrá con un toque al salón donde toca ahora. Se
              guarda en tu dispositivo, sin cuenta.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: 'var(--space-3)' }}
              onClick={onOpenSchedule}
            >
              Configurar mi horario
            </button>
          </>
        ) : currentClass ? (
          <div className="class-card">
            <div className="class-card__head">
              <span className="class-card__kind">En curso</span>
              <span className="class-card__time">
                {currentClass.startsAt}–{currentClass.endsAt}
              </span>
            </div>
            <span className="class-card__subject">{currentClass.subject}</span>
            <span className="class-card__meta">{currentClass.code}</span>
            <div className="pill-row" style={{ marginTop: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn-secondary btn--sm"
                onClick={() => onOpenRoute(currentClass.spaceId)}
              >
                Cómo llegar
              </button>
              <button type="button" className="btn-secondary btn--sm" onClick={onOpenSchedule}>
                Ver horario
              </button>
            </div>
          </div>
        ) : nextClass ? (
          <div className="class-card">
            <div className="class-card__head">
              <span className="class-card__kind">Próxima</span>
              <span className="class-card__time">
                {nextClass.startsAt}–{nextClass.endsAt}
              </span>
            </div>
            <span className="class-card__subject">{nextClass.subject}</span>
            <span className="class-card__meta">
              {nextClass.code}
              {programName ? ` · ${programName}` : ''}
            </span>
            <div className="pill-row" style={{ marginTop: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn-secondary btn--sm"
                onClick={() => onOpenRoute(nextClass.spaceId)}
              >
                Cómo llegar
              </button>
              <button type="button" className="btn-secondary btn--sm" onClick={onOpenSchedule}>
                Ver horario
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="card__body">No tenés clases en tu horario por ahora.</p>
            <button
              type="button"
              className="btn-secondary btn--sm"
              style={{ marginTop: 'var(--space-3)' }}
              onClick={onOpenSchedule}
            >
              Ver horario
            </button>
          </>
        )}
      </section>

      <section>
        <p className="card__eyebrow">Acciones rápidas</p>
        <div className="feature-grid">
          <button type="button" className="feature" onClick={onOpenScanner}>
            <span className="feature__icon" aria-hidden="true">
              📷
            </span>
            <span className="feature__label">Escanear QR</span>
            <span className="feature__hint">Ubicarme</span>
          </button>
          <button type="button" className="feature" onClick={() => onOpenRoute('A104')}>
            <span className="feature__icon" aria-hidden="true">
              🔍
            </span>
            <span className="feature__label">Buscar lugar</span>
            <span className="feature__hint">Probar ruta</span>
          </button>
        </div>
      </section>

      <section className="card card--muted">
        <h2 className="card__title">Estado del proyecto</h2>
        <p className="card__body">
          MVP académico. El objetivo es demostrar la navegación y las herramientas de
          administración, no una producción a escala.
        </p>
        <ul className="status-list">
          {PHASE_STEPS.map((step) => {
            const dot = DOT[step.state]
            return (
              <li key={step.label} className="status-list__item">
                <span className={dot.className} aria-hidden="true">
                  {dot.glyph}
                </span>
                <span>{step.label}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}
