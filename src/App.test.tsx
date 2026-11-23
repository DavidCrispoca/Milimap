import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { resetSession } from '@/auth/session'

function signInFromGate(): void {
  fireEvent.change(screen.getByLabelText('Correo o usuario'), {
    target: { value: 'ana.lopez@umng.edu.co' },
  })
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'cualquier-clave' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
}

describe('App', () => {
  beforeEach(() => {
    window.location.hash = ''
    localStorage.clear()
    resetSession()
  })

  it('asks for a session on the first visit', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Entra a Milimap' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /navegación principal/i })).toBeNull()
  })

  it('lets anyone in with simulated credentials', () => {
    render(<App />)
    signInFromGate()
    expect(screen.getByText('Sede Calle 100')).toBeInTheDocument()
  })

  it('rejects an empty identifier or password', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/correo y tu contraseña/i)
  })

  it('gives guests three tabs and no schedule', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Continuar como invitado' }))

    const nav = screen.getByRole('navigation', { name: /navegación principal/i })
    for (const label of ['Inicio', 'Mapa', 'Escanear']) {
      expect(within(nav).getByRole('button', { name: label })).toBeInTheDocument()
    }
    expect(within(nav).queryByRole('button', { name: 'Horario' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Mi horario' })).toBeNull()
  })

  it('exposes the four main navigation tabs to a signed-in student', () => {
    render(<App />)
    signInFromGate()

    const nav = screen.getByRole('navigation', { name: /navegación principal/i })
    for (const label of ['Inicio', 'Mapa', 'Escanear', 'Horario']) {
      expect(within(nav).getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('marks the home tab as the current page', () => {
    render(<App />)
    signInFromGate()
    expect(screen.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
  })

  it('asks a guest to sign in when they reach the schedule route', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Continuar como invitado' }))

    window.location.hash = '#/horario'
    fireEvent(window, new Event('hashchange'))

    expect(
      screen.getByRole('heading', { name: 'Inicia sesión para ver tu horario' }),
    ).toBeInTheDocument()
  })
})
