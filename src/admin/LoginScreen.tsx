import { useContentStore } from '@/content/store'
import { ROLE_LABEL } from '@/content/permissions'
import type { Role } from '@/content/types'

const ROLES: Array<{ id: Role; description: string }> = [
  {
    id: 'admin',
    description: 'Todo el panel: publica eventos y anuncios, edita espacios e importa horarios.',
  },
  {
    id: 'editor',
    description: 'Redacta eventos y anuncios como borrador, edita espacios e importa horarios.',
  },
  {
    id: 'viewer',
    description: 'Solo consulta. No modifica ningún dato.',
  },
]

export function LoginScreen() {
  const setRole = useContentStore((state) => state.setRole)

  return (
    <main className="login">
      <section className="login__card" aria-labelledby="login-title">
        <div className="login__band" aria-hidden="true" />
        <div className="login__body">
          <div className="login__brand">
            <span className="login__mark" aria-hidden="true">
              MM
            </span>
            <div>
              <h1 className="login__title" id="login-title">
                Panel de administración
              </h1>
              <p className="login__subtitle">Milimap · UMNG Sede Calle 100</p>
            </div>
          </div>

          <p className="login__subtitle">Elegí el nivel de acceso para esta sesión.</p>

          <div className="login__roles" role="group" aria-label="Nivel de acceso">
            {ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                className="login__role"
                onClick={() => setRole(role.id)}
              >
                <span className="stack" style={{ gap: 2 }}>
                  <span className="login__role-name">{ROLE_LABEL[role.id]}</span>
                  <span className="login__role-desc">{role.description}</span>
                </span>
              </button>
            ))}
          </div>

          <p className="login__footer">
            Acceso simulado por rol mientras no exista el backend institucional. Los cambios se
            guardan en este navegador.
          </p>
        </div>
      </section>
    </main>
  )
}
