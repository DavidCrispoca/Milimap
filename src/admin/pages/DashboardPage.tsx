import { useContentStore } from '@/content/store'
import { mergedCatalog } from '@/content/catalog'
import { activeAnnouncements, upcomingEvents } from '@/content/selectors'
import { EVENT_CATEGORY_LABEL, ANNOUNCEMENT_KIND_LABEL } from '@/content/types'
import { demoCatalog } from '@/data'
import { useNow } from '@/ui/useNow'
import { Alert, Badge, EmptyState, Panel, Stat } from '../ui'
import { formatDateTime } from '../format'

export function DashboardPage() {
  const events = useContentStore((state) => state.events)
  const announcements = useContentStore((state) => state.announcements)
  const classes = useContentStore((state) => state.classes)
  const spaceEdits = useContentStore((state) => state.spaceEdits)

  const now = useNow()
  const catalog = mergedCatalog(demoCatalog, spaceEdits)
  const roomName = (id: string | null): string =>
    id ? (catalog.find((entry) => entry.id === id)?.name ?? id) : 'Sin lugar'

  const publishedEvents = events.filter((event) => event.published).length
  const upcoming = upcomingEvents(events, now)
  const live = activeAnnouncements(announcements, now)
  const activeRooms = catalog.filter((entry) => entry.active).length

  return (
    <>
      <div className="stat-grid">
        <Stat
          label="Eventos publicados"
          value={publishedEvents}
          hint={`${events.length} en total`}
          accent
        />
        <Stat label="Próximos eventos" value={upcoming.length} hint="Aún no terminaron" />
        <Stat label="Anuncios vigentes" value={live.length} hint="Visibles en el inicio" />
        <Stat
          label="Espacios activos"
          value={activeRooms}
          hint={`de ${catalog.length} en el catálogo`}
        />
        <Stat label="Clases cargadas" value={classes.length} hint="Horario publicado" />
      </div>

      <div className="split">
        <Panel title="Próximos eventos" subtitle="Lo que ven los estudiantes en el inicio.">
          {upcoming.length === 0 ? (
            <EmptyState title="Nada programado" body="Los eventos publicados aparecen aquí." />
          ) : (
            <ul className="list">
              {upcoming.slice(0, 6).map((event) => (
                <li key={event.id} className="list__item">
                  <div className="list__body">
                    <span className="list__title">{event.title}</span>
                    <span className="list__meta">
                      {formatDateTime(event.startsAt)} · {roomName(event.spaceId)} ·{' '}
                      {EVENT_CATEGORY_LABEL[event.category]}
                    </span>
                  </div>
                  <span style={{ marginLeft: 'auto' }}>
                    <Badge tone={event.published ? 'published' : 'draft'}>
                      {event.published ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Anuncios vigentes">
          {live.length === 0 ? (
            <EmptyState
              title="Sin anuncios activos"
              body="Nada que mostrar en el inicio ahora mismo."
            />
          ) : (
            <ul className="list">
              {live.map((item) => (
                <li key={item.id} className="list__item">
                  <div className="list__body">
                    <span className="list__title">{item.message}</span>
                    <span className="list__meta">
                      {ANNOUNCEMENT_KIND_LABEL[item.kind]} · hasta {formatDateTime(item.endsAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Alert
        tone="info"
        title="Estado del sistema"
        items={[
          'Persistencia: este navegador (localStorage). Todavía no hay base de datos compartida.',
          'Acceso: por rol, sin contraseña. La autenticación institucional llega con el backend.',
          'Escaneos QR: la analítica de uso empieza en la Fase 5.',
        ]}
      />
    </>
  )
}
