import { catalogSchema, movieDetailSchema, type Catalog, type MovieDetail } from './schema'

const BASE_URL = import.meta.env.BASE_URL

/** Resolves a root-relative asset path ("/data/catalog.json") against the deploy base. */
export const assetUrl = (path: string): string =>
  /^https?:\/\//.test(path) ? path : `${BASE_URL}${path.replace(/^\//, '')}`

async function getJson(url: string, fetchImpl: typeof fetch, what: string): Promise<unknown> {
  const response = await fetchImpl(url)
  if (!response.ok) throw new Error(`Couldn't load ${what} (HTTP ${response.status}).`)
  return response.json()
}

export async function fetchCatalog(fetchImpl: typeof fetch = fetch): Promise<Catalog> {
  const json = await getJson(assetUrl('/data/catalog.json'), fetchImpl, 'the movie catalog')
  return catalogSchema.parse(json)
}

const detailCache = new Map<string, Promise<MovieDetail>>()

export function fetchMovieDetail(id: string, fetchImpl: typeof fetch = fetch): Promise<MovieDetail> {
  const cached = detailCache.get(id)
  if (cached) return cached
  const request = getJson(assetUrl(`/data/details/${id}.json`), fetchImpl, 'movie details').then(
    (json) => movieDetailSchema.parse(json),
  )
  detailCache.set(id, request)
  request.catch(() => detailCache.delete(id))
  return request
}

export function clearDetailCache(): void {
  detailCache.clear()
}
