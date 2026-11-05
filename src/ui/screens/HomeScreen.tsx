/**
 * Home screen.
 *
 * Phase 0 renders the real information architecture (announcements, "my
 * schedule", quick actions) with placeholder content, so the layout can be
 * reviewed before the data layer exists. Each block names the phase that fills
 * it in, which keeps the skeleton honest instead of pretending to work.
 */

const PHASE_STEPS = [
  { label: 'Fase 0 · Cimientos y tooling', state: 'done' as const },
  { label: 'Fase 1 · Motor de ruteo', state: 'next' as const },
  { label: 'Fase 2 · Admin: contenido', state: 'todo' as const },
  { label: 'Fase 3 · Admin: editor de mapa', state: 'todo' as const },
  { label: 'Fase 4 · App: mapa y navegación', state: 'todo' as const },
  { label: 'Fases 5-6 · QR, eventos y horario', state: 'todo' as const },
]

const DOT: Record<'done' | 'next' | 'todo', { className: string; glyph: string }> = {
  done: { className: 'status-list__dot status-list__dot--done', glyph: '✓' },
  next: { className: 'status-list__dot status-list__dot--next', glyph: '→' },
  todo: { className: 'status-list__dot status-list__dot--todo', glyph: '·' },
}

export function HomeScreen() {
  return (
    <>
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
        <h2 className="card__title">Cartelera de eventos</h2>
        <p className="card__body">
          Próximamente: eventos especiales con fecha, lugar y acceso directo a la ruta.
        </p>
        <ul className="status-list">
          <li className="status-list__item">
            <span className={`${DOT.todo.className}`}>·</span>
            <span>Los anuncios se cargan desde el panel de administración (Fase 2).</span>
          </li>
        </ul>
      </section>

      <section className="card">
        <h2 className="card__title">Mi horario</h2>
        <p className="card__body">
          Selecciona tus clases del semestre y entra con un toque al salón donde toca ahora. Se
          guarda en tu dispositivo, sin cuenta.
        </p>
        <ul className="status-list">
          <li className="status-list__item">
            <span className={`${DOT.todo.className}`}>·</span>
            <span>Disponible en la Fase 6.</span>
          </li>
        </ul>
      </section>

      <section>
        <p className="card__eyebrow">Acciones rápidas</p>
        <div className="feature-grid">
          <button type="button" className="feature" disabled>
            <span className="feature__icon" aria-hidden="true">
              📷
            </span>
            <span className="feature__label">Escanear QR</span>
            <span className="feature__hint">Fase 5</span>
          </button>
          <button type="button" className="feature" disabled>
            <span className="feature__icon" aria-hidden="true">
              🔍
            </span>
            <span className="feature__label">Buscar lugar</span>
            <span className="feature__hint">Fase 4</span>
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
