import { useMemo, useState, type ChangeEvent } from 'react'
import { useContentStore, DEFAULT_TERM } from '@/content/store'
import { can } from '@/content/permissions'
import { mergedCatalog } from '@/content/catalog'
import { demoCatalog } from '@/data'
import {
  SCHEDULE_CSV_TEMPLATE,
  findConflicts,
  parseScheduleCsv,
  type Conflict,
  type CsvError,
} from '@/schedule/csv'
import type { ScheduleClass } from '@/content/types'
import { Alert, Badge, Panel, Stat } from '../ui'

interface Review {
  classes: ScheduleClass[]
  errors: CsvError[]
  conflicts: Conflict[]
}

export function SchedulePage() {
  const role = useContentStore((state) => state.role)
  const classes = useContentStore((state) => state.classes)
  const spaceEdits = useContentStore((state) => state.spaceEdits)
  const replaceClasses = useContentStore((state) => state.replaceClasses)

  const canImport = can(role, 'import_schedule')
  const catalog = mergedCatalog(demoCatalog, spaceEdits)
  const activeRooms = useMemo(
    () => new Set(catalog.filter((entry) => entry.active).map((entry) => entry.id)),
    [catalog],
  )

  const [text, setText] = useState(SCHEDULE_CSV_TEMPLATE)
  const [review, setReview] = useState<Review | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const published = classes.filter((item) => item.termId === DEFAULT_TERM.id)
  const roomsUsed = new Set(published.map((item) => item.spaceId)).size

  const validate = () => {
    const parsed = parseScheduleCsv(text, {
      termId: DEFAULT_TERM.id,
      knownSpaceIds: activeRooms,
    })
    const conflicts = findConflicts(parsed.classes)
    setReview({ classes: parsed.classes, errors: parsed.errors, conflicts })
    setNotice(null)
  }

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setText(await file.text())
    setReview(null)
    setNotice(`Archivo cargado: ${file.name}. Revisalo y validalo antes de publicar.`)
  }

  const canPublish =
    canImport &&
    review !== null &&
    review.errors.length === 0 &&
    review.conflicts.length === 0 &&
    review.classes.length > 0

  const publish = () => {
    if (!review || !canPublish) return
    replaceClasses(DEFAULT_TERM.id, review.classes)
    setNotice(
      `Horario publicado: ${review.classes.length} clases en ${new Set(review.classes.map((c) => c.spaceId)).size} salones.`,
    )
    setReview(null)
  }

  return (
    <>
      {!canImport ? (
        <Alert
          tone="info"
          title="Modo consulta: solo un editor o administrador puede importar horarios."
        />
      ) : null}
      {notice ? <Alert tone="success" title={notice} /> : null}

      <div className="stat-grid">
        <Stat
          label="Término"
          value={DEFAULT_TERM.label}
          hint={`${DEFAULT_TERM.startsOn} → ${DEFAULT_TERM.endsOn}`}
          accent
        />
        <Stat label="Clases publicadas" value={published.length} hint="Del término activo" />
        <Stat label="Salones con clases" value={roomsUsed} hint="Salones distintos en uso" />
      </div>

      <div className="split">
        <Panel
          title="Importar horario (CSV)"
          subtitle="La validación revisa cada fila. Una fila mala no bloquea el resto, pero el archivo no se publica hasta corregir todos los errores."
          actions={
            canImport ? (
              <>
                <label className="btn btn--sm" style={{ cursor: 'pointer' }}>
                  Cargar archivo
                  <input type="file" accept=".csv,text/csv" hidden onChange={onFile} />
                </label>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setText(SCHEDULE_CSV_TEMPLATE)
                    setReview(null)
                  }}
                >
                  Usar plantilla
                </button>
              </>
            ) : null
          }
        >
          <div className="stack">
            <label className="field">
              <span className="field__label">Contenido del archivo</span>
              <textarea
                className="textarea textarea--code"
                value={text}
                spellCheck={false}
                disabled={!canImport}
                aria-label="Contenido CSV del horario"
                onChange={(event) => {
                  setText(event.target.value)
                  setReview(null)
                }}
              />
            </label>
            <p className="field__hint">
              Columnas: codigo, materia, docente, salon, dia (1-6 o nombre), inicio, fin, grupo. El
              salón debe existir en el catálogo.
            </p>
            <div className="table__actions" style={{ justifyContent: 'flex-start' }}>
              <button type="button" className="btn" onClick={validate} disabled={!canImport}>
                Validar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={publish}
                disabled={!canPublish}
              >
                Publicar horario
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Resultado de la validación">
          {!review ? (
            <p className="text-muted">Validá el archivo para ver los errores y conflictos.</p>
          ) : (
            <div className="stack">
              <div className="table__actions" style={{ justifyContent: 'flex-start' }}>
                <Badge tone="published">{review.classes.length} filas válidas</Badge>
                <Badge tone={review.errors.length ? 'danger' : 'published'}>
                  {review.errors.length} error(es)
                </Badge>
                <Badge tone={review.conflicts.length ? 'danger' : 'published'}>
                  {review.conflicts.length} conflicto(s)
                </Badge>
              </div>

              {review.errors.length > 0 ? (
                <Alert
                  tone="danger"
                  title="Filas con error (no se importan)"
                  items={review.errors.map((item) => `Línea ${item.line}: ${item.message}`)}
                />
              ) : null}

              {review.conflicts.length > 0 ? (
                <Alert
                  tone="danger"
                  title="Conflictos de salón (bloquean la publicación)"
                  items={review.conflicts.map((item) => item.message)}
                />
              ) : null}

              {review.errors.length === 0 &&
              review.conflicts.length === 0 &&
              review.classes.length > 0 ? (
                <Alert tone="success" title="Archivo válido. Ya podés publicar el horario." />
              ) : null}
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}
