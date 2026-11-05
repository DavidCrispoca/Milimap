import { useState, type FormEvent } from 'react'
import { useContentStore } from '@/content/store'
import { can } from '@/content/permissions'
import { mergedCatalog } from '@/content/catalog'
import { issuesToMap, eventInputSchema } from '@/content/validation'
import {
  EVENT_CATEGORY_LABEL,
  EVENT_PRIORITY_LABEL,
  type CampusEvent,
  type EventCategory,
  type EventPriority,
} from '@/content/types'
import { demoCatalog } from '@/data'
import { Alert, Badge, EmptyState, Modal, Panel } from '../ui'
import { defaultWindow, formatDateTime } from '../format'

interface Draft {
  id?: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  spaceId: string
  category: EventCategory
  priority: EventPriority
  published: boolean
}

function emptyDraft(): Draft {
  const window = defaultWindow()
  return {
    title: '',
    description: '',
    startsAt: window.start,
    endsAt: window.end,
    spaceId: 'BIB',
    category: 'academic',
    priority: 'normal',
    published: false,
  }
}

function draftFrom(event: CampusEvent): Draft {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    spaceId: event.spaceId ?? '',
    category: event.category,
    priority: event.priority,
    published: event.published,
  }
}

export function EventsPage() {
  const role = useContentStore((state) => state.role)
  const events = useContentStore((state) => state.events)
  const spaceEdits = useContentStore((state) => state.spaceEdits)
  const addEvent = useContentStore((state) => state.addEvent)
  const updateEvent = useContentStore((state) => state.updateEvent)
  const removeEvent = useContentStore((state) => state.removeEvent)
  const toggleEventPublished = useContentStore((state) => state.toggleEventPublished)

  const catalog = mergedCatalog(demoCatalog, spaceEdits)
  const roomName = (spaceId: string | null): string =>
    spaceId ? (catalog.find((entry) => entry.id === spaceId)?.name ?? spaceId) : 'Sin lugar'

  const canEdit = can(role, 'edit_event')
  const canPublish = can(role, 'publish_event')

  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)

  const visible = [...events]
    .filter((event) => event.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))

  const save = (event: FormEvent) => {
    event.preventDefault()
    if (!draft) return

    const parsed = eventInputSchema.safeParse({
      title: draft.title,
      description: draft.description,
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      spaceId: draft.spaceId || null,
      category: draft.category,
      priority: draft.priority,
      published: canPublish ? draft.published : false,
    })

    if (!parsed.success) {
      setErrors(issuesToMap(parsed.error.issues))
      return
    }
    setErrors({})

    if (draft.id) {
      updateEvent(draft.id, parsed.data)
      setNotice(`Evento actualizado: ${parsed.data.title}`)
    } else {
      const created = addEvent(parsed.data)
      setNotice(
        created
          ? created.published
            ? `Evento publicado: ${created.title}. Ya aparece en la app.`
            : `Borrador guardado: ${created.title}. Un administrador debe publicarlo.`
          : 'No se pudo guardar el evento.',
      )
    }
    setDraft(null)
  }

  const field = (name: keyof Draft, label: string, input: React.ReactNode, hint?: string) => (
    <label className={`field${name === 'description' ? ' form-grid__full' : ''}`}>
      <span className="field__label">{label}</span>
      {input}
      {errors[name] ? <span className="field__error">{errors[name]}</span> : null}
      {!errors[name] && hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  )

  return (
    <>
      {!canEdit ? (
        <Alert tone="info" title="Modo consulta: no tenés permisos para modificar eventos." />
      ) : null}
      {notice ? <Alert tone="success" title={notice} /> : null}

      <Panel
        title="Eventos"
        subtitle="Se muestran en el inicio de la app cuando están publicados y no terminaron."
        actions={
          <>
            <input
              className="input"
              style={{ width: 220 }}
              type="search"
              placeholder="Buscar por título"
              aria-label="Buscar eventos"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {canEdit ? (
              <button
                type="button"
                className="btn btn--gold"
                onClick={() => {
                  setErrors({})
                  setDraft(emptyDraft())
                }}
              >
                + Nuevo evento
              </button>
            ) : null}
          </>
        }
        flush
      >
        {visible.length === 0 ? (
          <EmptyState
            title="Sin eventos"
            body="Creá el primero con el botón superior. Los borradores quedan visibles solo para el equipo."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Fecha</th>
                  <th>Lugar</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td className="table__primary">{item.title}</td>
                    <td>{formatDateTime(item.startsAt)}</td>
                    <td>{roomName(item.spaceId)}</td>
                    <td>{EVENT_CATEGORY_LABEL[item.category]}</td>
                    <td>
                      <Badge tone={item.published ? 'published' : 'draft'}>
                        {item.published ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </td>
                    <td>
                      <div className="table__actions">
                        {canEdit ? (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => {
                              setErrors({})
                              setDraft(draftFrom(item))
                            }}
                          >
                            Editar
                          </button>
                        ) : null}
                        {canPublish ? (
                          <button
                            type="button"
                            className="btn btn--sm"
                            onClick={() => toggleEventPublished(item.id)}
                          >
                            {item.published ? 'Despublicar' : 'Publicar'}
                          </button>
                        ) : null}
                        {canEdit ? (
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar "${item.title}"?`)) {
                                removeEvent(item.id)
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {draft ? (
        <Modal
          title={draft.id ? 'Editar evento' : 'Nuevo evento'}
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setDraft(null)}>
                Cancelar
              </button>
              <button type="submit" form="event-form" className="btn btn--primary">
                Guardar
              </button>
            </>
          }
        >
          <form id="event-form" className="form-grid" onSubmit={save} noValidate>
            {field(
              'title',
              'Título',
              <input
                className={`input${errors.title ? ' input--invalid' : ''}`}
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />,
            )}
            {field(
              'spaceId',
              'Lugar',
              <select
                className="select"
                value={draft.spaceId}
                onChange={(event) => setDraft({ ...draft, spaceId: event.target.value })}
              >
                <option value="">Sin lugar</option>
                {catalog
                  .filter((entry) => entry.active)
                  .map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name} · P{entry.level}
                    </option>
                  ))}
              </select>,
              'Al publicar, la app ofrece "Cómo llegar" a este lugar.',
            )}
            {field(
              'startsAt',
              'Inicio',
              <input
                className="input"
                type="datetime-local"
                value={draft.startsAt}
                onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
              />,
            )}
            {field(
              'endsAt',
              'Fin',
              <input
                className="input"
                type="datetime-local"
                value={draft.endsAt}
                onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
              />,
            )}
            {field(
              'category',
              'Categoría',
              <select
                className="select"
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value as EventCategory })
                }
              >
                {Object.entries(EVENT_CATEGORY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>,
            )}
            {field(
              'priority',
              'Prioridad',
              <select
                className="select"
                value={draft.priority}
                onChange={(event) =>
                  setDraft({ ...draft, priority: event.target.value as EventPriority })
                }
              >
                {Object.entries(EVENT_PRIORITY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>,
              'Alta aparece primero en el carrusel del inicio.',
            )}
            {field(
              'description',
              'Descripción',
              <textarea
                className={`textarea${errors.description ? ' textarea--invalid' : ''}`}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />,
            )}
            <label className="field form-grid__full">
              <span className="field__label">Publicación</span>
              <span className="table__actions" style={{ justifyContent: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={canPublish ? draft.published : false}
                  disabled={!canPublish}
                  onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
                />
                <span>Publicar en la app al guardar</span>
              </span>
              {!canPublish ? (
                <span className="field__hint">
                  Solo un administrador puede publicar. Tu cambio queda como borrador.
                </span>
              ) : null}
            </label>
          </form>
        </Modal>
      ) : null}
    </>
  )
}
