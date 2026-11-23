import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { resetSession } from '@/auth/session'

function signInFromGate(): void {
  fireEvent.change(screen.getByLabelText('Correo o usuario'), {
    target: { value: 'est.estudiante@unimilitar.edu.co' },
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

  it('builds the schedule with the day/hour/subject/room form', () => {
    render(<App />)
    signInFromGate()
    fireEvent.click(screen.getByRole('button', { name: 'Horario' }))

    expect(screen.getByRole('heading', { name: 'Arma tu horario' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Día'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '14:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '15:50' } })
    fireEvent.change(screen.getByLabelText('Materia'), { target: { value: 'Álgebra lineal' } })
    fireEvent.change(screen.getByLabelText('Salón'), { target: { value: 'Aula B 101' } })

    expect(screen.getByText(/Ruta disponible hasta Aula B 101/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Agregar al horario' }))

    expect(screen.getAllByText(/Álgebra lineal/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Miércoles').length).toBeGreaterThan(1)
    expect(screen.getAllByRole('button', { name: 'Cómo llegar' }).length).toBeGreaterThan(0)

    const stored = JSON.parse(localStorage.getItem('milimap.schedule.v2') ?? 'null') as {
      classes: Array<Record<string, unknown>>
    }
    expect(stored.classes).toHaveLength(1)
    expect(stored.classes[0]).toMatchObject({
      weekday: 3,
      startsAt: '14:00',
      endsAt: '15:50',
      subject: 'Álgebra lineal',
      room: 'Aula B 101',
      spaceId: 'AULA-B101',
    })
  })

  it('rejects a class that ends before it starts', () => {
    render(<App />)
    signInFromGate()
    fireEvent.click(screen.getByRole('button', { name: 'Horario' }))

    fireEvent.change(screen.getByLabelText('Materia'), { target: { value: 'Física' } })
    fireEvent.change(screen.getByLabelText('Salón'), { target: { value: 'Aula B101' } })
    fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '09:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al horario' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/hora de fin debe ser mayor/i)
    expect(localStorage.getItem('milimap.schedule.v2')).toBeNull()
  })
})
