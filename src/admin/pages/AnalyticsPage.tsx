import { useContentStore } from '@/content/store'
import { mergedCatalog } from '@/content/catalog'
import { activeAnnouncements } from '@/content/selectors'
import { ANNOUNCEMENT_KIND_LABEL, EVENT_CATEGORY_LABEL, type EventCategory } from '@/content/types'
import { demoCatalog } from '@/data'
import { useNow } from '@/ui/useNow'
import { Alert, Panel, Stat } from '../ui'
import './extras.css'

function Bars({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <ul className="bar-list">
      {rows.map((row) => (
        <li key={row.label} className="bar-list__row">
          <span className="bar-list__label">{row.label}</span>
          <span className="bar-list__track" aria-hidden="true">
            <span className="bar-list__fill" style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <span className="bar-list__value">{row.value}</span>
        </li>
      ))}
    </ul>
  )
}

export function AnalyticsPage() {
  const events = useContentStore((state) => state.events)
  const announcements = useContentStore((state) => state.announcements)
  const classes = useContentStore((state) => state.classes)
  const spaceEdits = useContentStore((state) => state.spaceEdits)

  const catalog = mergedCatalog(demoCatalog, spaceEdits)
  const now = useNow()

  const categoryCounts = (Object.keys(EVENT_CATEGORY_LABEL) as EventCategory[]).map((key) => ({
    label: EVENT_CATEGORY_LABEL[key],
    value: events.filter((event) => event.category === key && event.published).length,
  }))

  const kindCounts = (['info', 'warning', 'emergency'] as const).map((kind) => ({
    label: ANNOUNCEMENT_KIND_LABEL[kind],
    value: announcements.filter((item) => item.kind === kind).length,
  }))

  const busiest = Object.entries(
    classes.reduce<Record<string, number>>((acc, item) => {
      acc[item.spaceId] = (acc[item.spaceId] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([id, value]) => ({ label: catalog.find((entry) => entry.id === id)?.name ?? id, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const draftEvents = events.filter((event) => !event.published).length

  return (
    <>
      <div className="stat-grid">
        <Stat label="Eventos publicados" value={events.filter((e) => e.published).length} />
        <Stat label="Borradores" value={draftEvents} hint="Pendientes de publicar" />
        <Stat
          label="Anuncios vigentes"
          value={activeAnnouncements(announcements, now).length}
          accent
        />
        <Stat label="Escaneos QR" value="—" hint="Disponible desde la Fase 5" />
      </div>

      <div className="split">
        <Panel title="Eventos por categoría" subtitle="Solo eventos publicados.">
          <Bars rows={categoryCounts} />
        </Panel>
        <Panel title="Anuncios por tipo">
          <Bars rows={kindCounts} />
        </Panel>
      </div>

      <Panel
        title="Salones con más clases"
        subtitle="Cantidad de clases publicadas por salón. Indica dónde habrá más tránsito."
      >
        {busiest.length === 0 ? (
          <p className="text-muted">Todavía no hay horario publicado.</p>
        ) : (
          <Bars rows={busiest} />
        )}
      </Panel>

      <Alert
        tone="info"
        title="Qué se medirá cuando exista uso real"
        items={[
          'Destinos más buscados y rutas que fallaron (Fase 5).',
          'QR más escaneados, para decidir dónde instalar más stickers (Fase 5).',
        ]}
      />
    </>
  )
}
