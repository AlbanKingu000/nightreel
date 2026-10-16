import type { Catalog, Movie } from '../data/schema'
import { catalogStats, type CatalogStats } from './ranking'

export interface Credits {
  directed: string[]
  acted: string[]
}

/** Lookup tables built once per catalog load. */
export interface CatalogIndex {
  movies: readonly Movie[]
  byId: ReadonlyMap<string, Movie>
  bySlug: ReadonlyMap<string, Movie>
  people: Readonly<Record<string, string>>
  credits: ReadonlyMap<string, Credits>
  stats: CatalogStats
  generatedAt: string
}

function collectCredits(movies: readonly Movie[]): Map<string, Credits> {
  const credits = new Map<string, Credits>()
  const creditFor = (id: string): Credits => {
    const existing = credits.get(id)
    if (existing) return existing
    const created: Credits = { directed: [], acted: [] }
    credits.set(id, created)
    return created
  }
  for (const movie of movies) {
    movie.directors.forEach((id) => creditFor(id).directed.push(movie.id))
    movie.cast.forEach((id) => creditFor(id).acted.push(movie.id))
  }
  return credits
}

export function buildCatalogIndex(catalog: Catalog): CatalogIndex {
  const { movies } = catalog
  return {
    movies,
    byId: new Map(movies.map((movie) => [movie.id, movie])),
    bySlug: new Map(movies.map((movie) => [movie.slug, movie])),
    people: catalog.people,
    credits: collectCredits(movies),
    stats: catalogStats(movies),
    generatedAt: catalog.generatedAt,
  }
}

export const personName = (index: CatalogIndex, id: string): string =>
  index.people[id] ?? 'Unknown'

export function moviesByIds(index: CatalogIndex, ids: readonly string[]): Movie[] {
  return ids.flatMap((id) => {
    const movie = index.byId.get(id)
    return movie ? [movie] : []
  })
}
