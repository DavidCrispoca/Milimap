import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  continueAsGuest,
  displayNameFrom,
  getSession,
  resetSession,
  SESSION_KEY,
  signIn,
  signOut,
} from './session'

describe('simulated student session', () => {
  beforeEach(() => {
    localStorage.clear()
    resetSession()
  })

  it('turns a university identifier into a readable name', () => {
    expect(displayNameFrom('ana.lopez@umng.edu.co')).toBe('Ana Lopez')
    expect(displayNameFrom('juan_perez-99')).toBe('Juan Perez 99')
    expect(displayNameFrom('   ')).toBe('Estudiante')
  })

  it('accepts any non-empty identifier and never stores the password', () => {
    const session = signIn('ana@umng.edu.co')
    expect(session).toMatchObject({ kind: 'user', email: 'ana@umng.edu.co', name: 'Ana' })
    expect(getSession()).toEqual(session)

    const raw = localStorage.getItem(SESSION_KEY) ?? ''
    expect(raw).toContain('"kind":"user"')
    expect(raw).not.toContain('password')
  })

  it('ignores an empty identifier', () => {
    expect(signIn('   ')).toBeNull()
    expect(getSession()).toBeNull()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('persists guest mode', () => {
    continueAsGuest()
    expect(getSession()).toEqual({ kind: 'guest' })
    expect(localStorage.getItem(SESSION_KEY)).toBe('{"kind":"guest"}')
  })

  it('signs out and forgets the session', () => {
    signIn('ana@umng.edu.co')
    signOut()
    expect(getSession()).toBeNull()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('recovers a stored session on a fresh load and rejects malformed data', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ kind: 'guest' }))
    vi.resetModules()
    const fresh = await import('./session')
    expect(fresh.getSession()).toEqual({ kind: 'guest' })

    localStorage.setItem(SESSION_KEY, '{"kind":"user"}')
    vi.resetModules()
    const broken = await import('./session')
    expect(broken.getSession()).toBeNull()
  })
})
