/**
 * Welcome / login screen.
 *
 * The backend is simulated: any non-empty identifier and password work. The
 * form never stores the password. Guests can enter the map and scanner, but the
 * schedule stays behind the login.
 */

import { useState, type FormEvent } from 'react'
import { useSession } from '@/auth/session'

export function AuthScreen({ canCancel, onDone }: { canCancel: boolean; onDone: () => void }) {
  const { session, signIn, continueAsGuest, signOut } = useSession()
  const signedIn = session?.kind === 'user' ? session : null
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!identifier.trim() || !password.trim()) {
      setError('Escribe tu correo y tu contraseña para continuar.')
      return
    }
    setError(null)
    signIn(identifier)
    onDone()
  }

  const enterAsGuest = (): void => {
    continueAsGuest()
    onDone()
  }

  return (
    <main className="auth">
      <section className="auth__card" aria-labelledby="auth-title">
        <div className="auth__band" aria-hidden="true" />
        <div className="auth__body">
          <div className="auth__brand">
            <span className="auth__mark" aria-hidden="true">
              MM
            </span>
            <div>
              <p className="auth__eyebrow">Milimap · UMNG Sede Calle 100</p>
              <h1 className="auth__title" id="auth-title">
                {signedIn ? 'Tu cuenta' : 'Entra a Milimap'}
              </h1>
            </div>
          </div>

          <p className="auth__intro">
            {signedIn
              ? `Sesión iniciada como ${signedIn.name}. Puedes cambiar de cuenta o cerrar sesión.`
              : 'Inicia sesión para guardar tu horario y llegar a tus clases. También puedes continuar como invitado.'}
          </p>

          <form className="auth__form" onSubmit={submit} noValidate>
            <label className="field">
              <span className="field__label">Correo o usuario</span>
              <input
                className="field__input"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="est.estudiante@unimilitar.edu.co"
              />
            </label>

            <label className="field">
              <span className="field__label">Contraseña</span>
              <input
                className="field__input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </label>

            {error ? (
              <p className="auth__error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn-primary">
              Iniciar sesión
            </button>
          </form>

          {!session ? (
            <>
              <div className="auth__divider" aria-hidden="true">
                <span>o</span>
              </div>
              <button type="button" className="btn-secondary" onClick={enterAsGuest}>
                Continuar como invitado
              </button>
              <p className="auth__note">
                Como invitado puedes ver el mapa, escanear QR y calcular rutas. El horario se activa
                al iniciar sesión.
              </p>
            </>
          ) : null}

          <div className="auth__links">
            {canCancel ? (
              <button type="button" className="link-btn" onClick={onDone}>
                Volver
              </button>
            ) : null}
            {signedIn ? (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  signOut()
                  onDone()
                }}
              >
                Cerrar sesión
              </button>
            ) : null}
          </div>

          <p className="auth__note auth__note--legal">
            Acceso simulado: cualquier correo y contraseña funcionan. Los datos quedan en este
            dispositivo y la contraseña no se guarda.
          </p>
        </div>
      </section>
    </main>
  )
}
