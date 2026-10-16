import { vi } from 'vitest'
import { clearDetailCache } from '../data/loadCatalog'
import type { MovieDetail } from '../data/schema'

export function makeDetail(id: string, overrides: Partial<MovieDetail> = {}): MovieDetail {
  return {
    id,
    overview: `Overview of ${id}.`,
    releaseDate: '2010-07-08',
    countries: ['United States'],
    trailer: null,
    wikipedia: `https://en.wikipedia.org/wiki/${id}`,
    similar: [],
    ...overrides,
  }
}

/** Serves /data/details/{id}.json from memory; any other URL is a 404. */
export function stubDetailFetch(overrides: Record<string, Partial<MovieDetail>> = {}) {
  clearDetailCache()
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const id = /details\/(Q\d+)\.json/.exec(String(input))?.[1]
    if (!id) return new Response('not found', { status: 404 })
    return new Response(JSON.stringify(makeDetail(id, overrides[id])), { status: 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
