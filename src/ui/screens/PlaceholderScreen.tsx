/**
 * Placeholder for screens that are planned but not implemented yet.
 *
 * Deliberately explicit: it always says which phase delivers the screen and
 * what that screen will do, so nobody mistakes the skeleton for a broken app.
 */

interface PlaceholderScreenProps {
  title: string
  phase: number
  body: string
}

export function PlaceholderScreen({ title, phase, body }: PlaceholderScreenProps) {
  return (
    <section className="card">
      <p className="card__eyebrow">Se implementa en la fase {phase}</p>
      <h1 className="card__title">{title}</h1>
      <p className="card__body">{body}</p>
      <p className="muted" style={{ marginTop: 'var(--space-4)' }}>
        Esta pantalla está reservada en la navegación para que el diseño se revise completo desde el
        inicio.
      </p>
    </section>
  )
}
