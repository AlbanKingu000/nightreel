import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeDetail } from '../test/details'
import { sampleCatalog } from '../test/fixtures'
import { assetUrl, clearDetailCache, fetchCatalog, fetchMovieDetail } from './loadCatalog'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

afterEach(() => clearDetailCache())

describe('assetUrl', () => {
  it('resolves root paths against the deploy base and leaves absolute URLs alone', () => {
    expect(assetUrl('/data/catalog.json')).toBe('/data/catalog.json')
    expect(assetUrl('https://example.org/x.json')).toBe('https://example.org/x.json')
  })
})

describe('fetchCatalog', () => {
  it('loads and validates the catalog', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(sampleCatalog()))
    await expect(fetchCatalog(fetchImpl)).resolves.toMatchObject({ version: 1 })
    expect(fetchImpl).toHaveBeenCalledWith('/data/catalog.json')
  })

  it('reports HTTP errors', async () => {
    await expect(fetchCatalog(vi.fn().mockResolvedValue(json({}, 503)))).rejects.toThrow(/HTTP 503/)
  })

  it('rejects malformed data', async () => {
    await expect(fetchCatalog(vi.fn().mockResolvedValue(json({ version: 2 })))).rejects.toThrow()
  })
})

describe('fetchMovieDetail', () => {
  it('caches successful requests', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => json(makeDetail('Q1')))
    await fetchMovieDetail('Q1', fetchImpl)
    await fetchMovieDetail('Q1', fetchImpl)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('forgets failures so they can be retried', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({}, 500))
      .mockResolvedValueOnce(json(makeDetail('Q2')))
    await expect(fetchMovieDetail('Q2', fetchImpl)).rejects.toThrow()
    await expect(fetchMovieDetail('Q2', fetchImpl)).resolves.toMatchObject({ id: 'Q2' })
  })
})
