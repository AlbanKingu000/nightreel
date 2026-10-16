// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createHttp, HttpError } from './http'

const res = (status: number, body = '{}', headers: Record<string, string> = {}) =>
  new Response(body, { status, headers })

function setup(responses: Array<Response | Error>) {
  const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => {
    const next = responses.shift()
    if (!next) throw new Error('no more responses')
    if (next instanceof Error) throw next
    return next
  })
  const sleep = vi.fn(async () => {})
  const http = createHttp({
    userAgent: 'test-agent',
    fetchImpl: fetchImpl as unknown as typeof fetch,
    sleep,
    baseDelayMs: 100,
    retries: 2,
  })
  return { http, fetchImpl, sleep }
}

describe('createHttp', () => {
  it('sends the user agent and parses json', async () => {
    const { http, fetchImpl } = setup([res(200, '{"ok":true}')])
    await expect(http.json('https://x.test/a')).resolves.toEqual({ ok: true })
    const init = fetchImpl.mock.calls[0]![1] as RequestInit
    expect(new Headers(init.headers).get('User-Agent')).toBe('test-agent')
  })

  it('merges extra headers', async () => {
    const { http, fetchImpl } = setup([res(200)])
    await http.json('https://x.test/h', { headers: { Accept: 'application/json' } })
    const init = fetchImpl.mock.calls[0]![1] as RequestInit
    expect(new Headers(init.headers).get('Accept')).toBe('application/json')
  })

  it('retries on 429 honoring Retry-After, then succeeds', async () => {
    const { http, sleep } = setup([res(429, '', { 'Retry-After': '3' }), res(200, '{"n":1}')])
    await expect(http.json('https://x.test/b')).resolves.toEqual({ n: 1 })
    expect(sleep).toHaveBeenCalledWith(3000)
  })

  it('caps very long Retry-After waits', async () => {
    const { http, sleep } = setup([res(429, '', { 'Retry-After': '3600' }), res(200)])
    await http.json('https://x.test/slow')
    expect(sleep).toHaveBeenCalledWith(30_000)
  })

  it('retries network errors and 5xx with exponential backoff', async () => {
    const { http, sleep } = setup([new TypeError('fetch failed'), res(503), res(200)])
    await http.json('https://x.test/c')
    expect(sleep.mock.calls.map((call) => (call as unknown[])[0])).toEqual([100, 200])
  })

  it('throws HttpError after exhausting retries', async () => {
    const { http } = setup([res(500), res(500), res(500)])
    await expect(http.json('https://x.test/d')).rejects.toMatchObject({ status: 500 })
  })

  it('rethrows network errors after exhausting retries', async () => {
    const { http } = setup([new TypeError('a'), new TypeError('b'), new TypeError('c')])
    await expect(http.json('https://x.test/n')).rejects.toThrow('c')
  })

  it('does not retry 404 and exposes the status', async () => {
    const { http, fetchImpl } = setup([res(404)])
    const err = await http.json('https://x.test/e').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(HttpError)
    expect((err as HttpError).status).toBe(404)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('returns raw responses from fetch() without throwing on 4xx', async () => {
    const { http } = setup([res(401)])
    expect((await http.fetch('https://x.test/f')).status).toBe(401)
  })

  it('returns buffers and throws on failed buffer downloads', async () => {
    const { http } = setup([res(200, 'png-bytes'), res(404)])
    expect((await http.buffer('https://x.test/g')).toString()).toBe('png-bytes')
    await expect(http.buffer('https://x.test/missing')).rejects.toBeInstanceOf(HttpError)
  })

  it('spaces out requests by minIntervalMs', async () => {
    let clock = 0
    const sleep = vi.fn(async (ms: number) => {
      clock += ms
    })
    const fetchImpl = vi.fn(async () => res(200))
    const http = createHttp({
      userAgent: 'ua',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep,
      now: () => clock,
      minIntervalMs: 1000,
    })
    await http.json('https://x.test/1')
    await http.json('https://x.test/2')
    expect(sleep).toHaveBeenCalledWith(1000)
  })
})
