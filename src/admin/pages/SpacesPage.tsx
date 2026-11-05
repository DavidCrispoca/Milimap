import { useState } from 'react'
import { useContentStore } from '@/content/store'
import { can } from '@/content/permissions'
import { mergedCatalog } from '@/content/catalog'
import type { CatalogEntry } from '@/domain/types'
import { demoCatalog } from '@/data'
import { Alert, Badge, Modal, Panel, Stat } from '../ui'

interface Draft {
  id: string
  name: string
  aliases: string
  active: boolean
}

export function SpacesPage() {
  const role = useContentStore((state) => state.role)
  const spaceEdits = useContentStore((state) => state.spaceEdits)
  const setSpaceEdit = useContentStore((state) => state.setSpaceEdit)
  const clearSpaceEdit = useContentStore((state) => state.clearSpaceEdit)

  const canEdit = can(role, 'edit_space')
  const catalog = mergedCatalog(demoCatalog, spaceEdits)

  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const normalized = query.trim().toLowerCase()
  const visible = catalog
    .filter(
      (entry) =>
        entry.name.toLowerCase().includes(normalized) ||
        entry.id.toLowerCase().includes(normalized),
    )
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'))

  const active = catalog.filter((entry) => entry.active).length
  const edited = Object.keys(spaceEdits).length

  const openEditor = (entry: CatalogEntry) => {
    setDraft({
      id: entry.id,
      name: entry.name,
      aliases: entry.aliases.join(', '),
      active: entry.active,
    })
  }

  const save = () => {
    if (!draft) return
    const name = draft.name.trim()
    if (name.length < 3) {
      setNotice('El nombre necesita al menos 3 caracteres.')
      return
    }
    const aliases = draft.aliases
      .split(',')
      .map((alias) => alias.trim())
      .filter(Boolean)

    setSpaceEdit(draft.id, { name, aliases, active: draft.active })
    setNotice(`Espacio actualizado: ${name}.`)
    setDraft(null)
  }

  return (
    <>
      {!canEdit ? (
        <Alert tone="info" title="Modo consulta: no tenés permisos para editar espacios." />
      ) : null}
      {notice ? <Alert tone="success" title={notice} /> : null}

      <div className="stat-grid">
        <Stat label="Espacios" value={catalog.length} hint="En el catálogo del campus" />
        <Stat label="Activos" value={active} hint="Visibles para búsqueda y rutas" accent />
        <Stat label="Editados" value={edited} hint="Con cambios del panel" />
      </div>

      <Panel
        title="Catálogo de espacios"
        subtitle="Nombres, alias y estado. La geometría se edita con el editor de mapa (Fase 3)."
        actions={
          <input
            className="input"
            style={{ width: 240 }}
            type="search"
            placeholder="Buscar por nombre o código"
            aria-label="Buscar espacios"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        }
        flush
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Piso</th>
                <th>Alias</th>
                <th>Estado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => {
                const isEdited = Boolean(spaceEdits[entry.id])
                return (
                  <tr key={entry.id}>
                    <td className="table__mono">{entry.id}</td>
                    <td className="table__primary">
                      {entry.name}
                      {isEdited ? <span className="text-muted"> · editado</span> : null}
                    </td>
                    <td>{entry.kind}</td>
                    <td>P{entry.level}</td>
                    <td className="text-muted">{entry.aliases.length}</td>
                    <td>
                      <Badge tone={entry.active ? 'published' : 'draft'}>
                        {entry.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td>
                      <div className="table__actions">
                        {canEdit ? (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => openEditor(entry)}
                          >
                            Editar
                          </button>
                        ) : null}
                        {canEdit && isEdited ? (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => {
                              clearSpaceEdit(entry.id)
                              setNotice(`Se restauró el original de ${entry.id}.`)
                            }}
                          >
                            Restaurar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {draft ? (
        <Modal
          title={`Editar ${draft.id}`}
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setDraft(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn--primary" onClick={save}>
                Guardar cambios
              </button>
            </>
          }
        >
          <div className="form-grid">
            <label className="field form-grid__full">
              <span className="field__label">Nombre oficial</span>
              <input
                className="input"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </label>
            <label className="field form-grid__full">
              <span className="field__label">Alias</span>
              <input
                className="input"
                value={draft.aliases}
                onChange={(event) => setDraft({ ...draft, aliases: event.target.value })}
              />
              <span className="field__hint">
                Separados por coma. Son las formas en que el estudiante escribe el lugar.
              </span>
            </label>
            <label className="field form-grid__full">
              <span className="field__label">Estado</span>
              <span className="table__actions" style={{ justifyContent: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
                />
                <span>Visible para búsqueda y rutas</span>
              </span>
            </label>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
