import { useState, type FormEvent } from 'react'
import { useContentStore } from '@/content/store'
import { can } from '@/content/permissions'
import { ANNOUNCEMENT_KIND_LABEL, type Announcement, type AnnouncementKind } from '@/content/types'
import { announcementInputSchema, issuesToMap } from '@/content/validation'
import { activeAnnouncements } from '@/content/selectors'
import { useNow } from '@/ui/useNow'
import { Alert, Badge, EmptyState, Modal, Panel } from '../ui'
import { defaultWindow, formatDateTime } from '../format'

interface Draft {
  id?: string
  message: string
  kind: AnnouncementKind
  startsAt: string
  endsAt: string
  published: boolean
}

const TONE: Record<AnnouncementKind, 'info' | 'warning' | 'danger'> = {
  info: 'info',
  warning: 'warning',
  emergency: 'danger',
}

function emptyDraft(): Draft {
  const window = defaultWindow(24 * 7, 0, 7)
  return { message: '', kind: 'info', startsAt: window.start, endsAt: window.end, published: false }
}

export function AnnouncementsPage() {
  const role = useContentStore((state) => state.role)
  const announcements = useContentStore((state) => state.announcements)
  const addAnnouncement = useContentStore((state) => state.addAnnouncement)
  const updateAnnouncement = useContentStore((state) => state.updateAnnouncement)
  const removeAnnouncement = useContentStore((state) => state.removeAnnouncement)
  const toggleAnnouncementPublished = useContentStore((state) => state.toggleAnnouncementPublished)

  const canEdit = can(role, 'edit_announcement')
  const canPublish = can(role, 'publish_announcement')

  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)

  const now = useNow()
  const live = activeAnnouncements(announcements, now)

  const save = (event: FormEvent) => {
    event.preventDefault()
    if (!draft) return

    const parsed = announcementInputSchema.safeParse({
      message: draft.message,
      kind: draft.kind,
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      published: canPublish ? draft.published : false,
    })
    if (!parsed.success) {
      setErrors(issuesToMap(parsed.error.issues))
      return
    }
    setErrors({})

    if (draft.id) {
      updateAnnouncement(draft.id, parsed.data)
      setNotice('Anuncio actualizado.')
    } else {
      const created = addAnnouncement(parsed.data)
      setNotice(
        created?.published
          ? 'Anuncio publicado. Aparece en el inicio mientras esté vigente.'
          : 'Borrador guardado. Un administrador debe publicarlo.',
      )
    }
    setDraft(null)
  }

  const sorted = [...announcements].sort((a, b) => b.startsAt.localeCompare(a.startsAt))

  return (
    <>
      {!canEdit ? (
        <Alert tone="info" title="Modo consulta: no tenés permisos para modificar anuncios." />
      ) : null}
      {notice ? <Alert tone="success" title={notice} /> : null}

      <Panel
        title="Anuncios"
        subtitle={`${live.length} vigente(s) ahora. Los anuncios se ocultan solos al terminar su vigencia.`}
        actions={
          canEdit ? (
            <button
              type="button"
              className="btn btn--gold"
              onClick={() => {
                setErrors({})
                setDraft(emptyDraft())
              }}
            >
              + Nuevo anuncio
            </button>
          ) : null
        }
        flush
      >
        {sorted.length === 0 ? (
          <EmptyState title="Sin anuncios" body="No hay mensajes cargados." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mensaje</th>
                  <th>Tipo</th>
                  <th>Vigencia</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <AnnouncementRow
                    key={item.id}
                    item={item}
                    now={now}
                    canEdit={canEdit}
                    canPublish={canPublish}
                    onEdit={() => {
                      setErrors({})
                      setDraft({
                        id: item.id,
                        message: item.message,
                        kind: item.kind,
                        startsAt: item.startsAt,
                        endsAt: item.endsAt,
                        published: item.published,
                      })
                    }}
                    onToggle={() => toggleAnnouncementPublished(item.id)}
                    onRemove={() => {
                      if (window.confirm('¿Eliminar este anuncio?')) removeAnnouncement(item.id)
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {draft ? (
        <Modal
          title={draft.id ? 'Editar anuncio' : 'Nuevo anuncio'}
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setDraft(null)}>
                Cancelar
              </button>
              <button type="submit" form="announcement-form" className="btn btn--primary">
                Guardar
              </button>
            </>
          }
        >
          <form id="announcement-form" className="form-grid" onSubmit={save} noValidate>
            <label className="field form-grid__full">
              <span className="field__label">Mensaje</span>
              <textarea
                className={`textarea${errors.message ? ' textarea--invalid' : ''}`}
                value={draft.message}
                onChange={(event) => setDraft({ ...draft, message: event.target.value })}
              />
              {errors.message ? <span className="field__error">{errors.message}</span> : null}
            </label>
            <label className="field">
              <span className="field__label">Tipo</span>
              <select
                className="select"
                value={draft.kind}
                onChange={(event) =>
                  setDraft({ ...draft, kind: event.target.value as AnnouncementKind })
                }
              >
                {Object.entries(ANNOUNCEMENT_KIND_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Publicación</span>
              <span className="table__actions" style={{ justifyContent: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={canPublish ? draft.published : false}
                  disabled={!canPublish}
                  onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
                />
                <span>Publicar al guardar</span>
              </span>
            </label>
            <label className="field">
              <span className="field__label">Desde</span>
              <input
                className="input"
                type="datetime-local"
                value={draft.startsAt}
                onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Hasta</span>
              <input
                className={`input${errors.endsAt ? ' input--invalid' : ''}`}
                type="datetime-local"
                value={draft.endsAt}
                onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
              />
              {errors.endsAt ? <span className="field__error">{errors.endsAt}</span> : null}
            </label>
          </form>
        </Modal>
      ) : null}
    </>
  )
}

function AnnouncementRow({
  item,
  now,
  canEdit,
  canPublish,
  onEdit,
  onToggle,
  onRemove,
}: {
  item: Announcement
  now: Date
  canEdit: boolean
  canPublish: boolean
  onEdit: () => void
  onToggle: () => void
  onRemove: () => void
}) {
  const isLive = activeAnnouncements([item], now).length > 0
  const status = !item.published ? 'Borrador' : isLive ? 'Vigente' : 'Fuera de vigencia'
  const tone = !item.published ? 'draft' : isLive ? 'published' : 'warning'

  return (
    <tr>
      <td className="table__primary">{item.message}</td>
      <td>
        <Badge
          tone={
            TONE[item.kind] === 'danger'
              ? 'danger'
              : TONE[item.kind] === 'warning'
                ? 'warning'
                : 'info'
          }
        >
          {ANNOUNCEMENT_KIND_LABEL[item.kind]}
        </Badge>
      </td>
      <td className="mono-sm">
        {formatDateTime(item.startsAt)} → {formatDateTime(item.endsAt)}
      </td>
      <td>
        <Badge tone={tone}>{status}</Badge>
      </td>
      <td>
        <div className="table__actions">
          {canEdit ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={onEdit}>
              Editar
            </button>
          ) : null}
          {canPublish ? (
            <button type="button" className="btn btn--sm" onClick={onToggle}>
              {item.published ? 'Despublicar' : 'Publicar'}
            </button>
          ) : null}
          {canEdit ? (
            <button type="button" className="btn btn--danger btn--sm" onClick={onRemove}>
              Eliminar
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  )
}
