/**
 * Home screen.
 *
 * Phase 2: announcements and events come from the content store, so anything an
 * administrator publishes appears here. "Cómo llegar" opens the map tab with the
 * event's place as destination.
 */

import { useContentStore } from '@/content/store'
import { useNow } from '@/ui/useNow'
import { usePreferences } from '@/ui/preferences'
import { useT } from '@/i18n'
import { mergedCatalog } from '@/content/catalog'
import { activeAnnouncements, sortForCarousel, upcomingEvents } from '@/content/selectors'
import { EVENT_CATEGORY_LABEL, ANNOUNCEMENT_KIND_LABEL } from '@/content/types'
import { demoCatalog } from '@/data'
import { defaultStorage, loadStudentSchedule } from '@/schedule/student'
import { findCurrentClass, findNextClass } from '@/schedule/current'
import { useState } from 'react'
import type { SpaceId } from '@/domain/types'

const DAY_NUM = new Intl.DateTimeFormat('es-CO', { day: '2-digit' })
const MONTH_SHORT = new Intl.DateTimeFormat('es-CO', { month: 'short' })
const TIME_SHORT = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const ANNOUNCEMENT_CLASS = {
  info: 'alert alert--info',
  warning: 'alert alert--warning',
  emergency: 'alert alert--danger',
} as const

export function HomeScreen({
  isAuthenticated,
  onOpenRoute,
  onOpenScanner,
  onOpenSchedule,
}: {
  isAuthenticated: boolean
  onOpenRoute: (spaceId: SpaceId) => void
  onOpenScanner: () => void
  onOpenSchedule: () => void
}) {
  const { prefs, set: setPreference, reset: resetPreferences } = usePreferences()
  const t = useT()
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

  const myClasses = schedule?.classes ?? []
  const currentClass = findCurrentClass(myClasses, now)
  const nextClass = findNextClass(myClasses, now)

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
            {featured.map((event) => {
              const date = new Date(event.startsAt)
              return (
                <li key={event.id} className="event">
                  <div className="event__date" aria-hidden="true">
                    <span className="event__date-day">{DAY_NUM.format(date)}</span>
                    <span className="event__date-month">{MONTH_SHORT.format(date)}</span>
                  </div>
                  <div className="event__body">
                    <span className="event__title">{event.title}</span>
                    <span className="event__meta">
                      {EVENT_CATEGORY_LABEL[event.category]} · {roomName(event.spaceId)}
                    </span>
                    <span className="event__desc">{event.description}</span>
                    <div className="event__actions">
                      <span className="event__time">{TIME_SHORT.format(date)}</span>
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
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {isAuthenticated ? (
        <section className="card">
          <h2 className="card__title">Mi horario</h2>
          {myClasses.length === 0 ? (
            <>
              <p className="card__body">
                Agrega tus clases con día, hora, materia y salón, y entra con un toque al aula donde
                toca ahora. Se guarda en tu dispositivo.
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: 'var(--space-3)' }}
                onClick={onOpenSchedule}
              >
                Armar mi horario
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
              <span className="class-card__meta">{currentClass.room}</span>
              <div className="pill-row" style={{ marginTop: 'var(--space-2)' }}>
                {currentClass.spaceId ? (
                  <button
                    type="button"
                    className="btn-secondary btn--sm"
                    onClick={() => onOpenRoute(currentClass.spaceId as SpaceId)}
                  >
                    Cómo llegar
                  </button>
                ) : null}
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
              <span className="class-card__meta">{nextClass.room}</span>
              <div className="pill-row" style={{ marginTop: 'var(--space-2)' }}>
                {nextClass.spaceId ? (
                  <button
                    type="button"
                    className="btn-secondary btn--sm"
                    onClick={() => onOpenRoute(nextClass.spaceId as SpaceId)}
                  >
                    Cómo llegar
                  </button>
                ) : null}
                <button type="button" className="btn-secondary btn--sm" onClick={onOpenSchedule}>
                  Ver horario
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="card__body">No tienes clases en tu horario por ahora.</p>
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
      ) : null}

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
        <h2 className="card__title">{t('a11y.title')}</h2>
        <p className="card__body">{t('a11y.subtitle')}</p>
        <div className="settings-list">
          <label className="settings-row">
            <span>{t('a11y.contrast')}</span>
            <input
              type="checkbox"
              checked={prefs.highContrast}
              onChange={(event) => setPreference('highContrast', event.target.checked)}
            />
          </label>
          <label className="settings-row">
            <span>{t('a11y.text')}</span>
            <input
              type="checkbox"
              checked={prefs.largeText}
              onChange={(event) => setPreference('largeText', event.target.checked)}
            />
          </label>
          <label className="settings-row">
            <span>{t('a11y.motion')}</span>
            <input
              type="checkbox"
              checked={prefs.reduceMotion}
              onChange={(event) => setPreference('reduceMotion', event.target.checked)}
            />
          </label>
          <label className="settings-row settings-row--select">
            <span>{t('a11y.language')}</span>
            <select
              className="select"
              value={prefs.locale}
              onChange={(event) => setPreference('locale', event.target.value as 'es' | 'en')}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        <div className="settings-actions">
          <button type="button" className="link-btn" onClick={resetPreferences}>
            {t('a11y.reset')}
          </button>
          <span className="settings-actions__note">{t('a11y.note')}</span>
        </div>
      </section>
    </>
  )
}
