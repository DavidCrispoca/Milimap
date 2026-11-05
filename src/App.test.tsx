import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders the home screen with the active campus', () => {
    render(<App />)
    expect(screen.getByText('Sede Calle 100')).toBeInTheDocument()
  })

  it('exposes the four main navigation tabs', () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: /navegación principal/i })
    expect(nav).toBeInTheDocument()
    for (const label of ['Inicio', 'Mapa', 'Escanear', 'Horario']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('marks the home tab as the current page', () => {
    render(<App />)
    const home = screen.getByRole('button', { name: 'Inicio' })
    expect(home).toHaveAttribute('aria-current', 'page')
  })
})
