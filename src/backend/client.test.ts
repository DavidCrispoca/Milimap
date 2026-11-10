import { afterEach, describe, expect, it, vi } from 'vitest'
import { insertRow } from './client'

const URL = 'https://example.supabase.co'
const KEY = 'anon-key-123'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('backend/client insertRow', () => {
  it('POSTs a row to PostgREST with the anon key and minimal-return preference', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', URL)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', KEY)

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 })
    vi.stubGlobal('fetch', fetchMock)

    const result = await insertRow('milimap_analytics_events', { kind: 'scan', payload: {} })

    expect(result.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${URL}/rest/v1/milimap_analytics_events`)
    expect(options.method).toBe('POST')
    expect((options.headers as Record<string, string>).apikey).toBe(KEY)
    expect((options.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`)
    expect((options.headers as Record<string, string>).Prefer).toBe('return=minimal')
    expect(options.body).toBe(JSON.stringify({ kind: 'scan', payload: {} }))
  })

  it('returns { ok: false } without throwing when the backend is not configured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await insertRow('milimap_analytics_events', {})

    expect(result).toEqual({ ok: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('swallows network errors and returns { ok: false }', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', URL)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', KEY)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    const result = await insertRow('milimap_analytics_events', {})

    expect(result).toEqual({ ok: false })
  })
})
