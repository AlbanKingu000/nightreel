import Fuse from 'fuse.js'
import type { Movie } from '../data/schema'
import type { CatalogIndex } from './catalog-index'
import { foldDiacritics } from './text'

export interface PersonHit {
  id: string
  name: string
  credits: number
}

export interface SearchResults {
  movies: Movie[]
  people: PersonHit[]
}

export type SearchFn = (query: string, limit?: number) => SearchResults

const MIN_QUERY_LENGTH = 2
const MAX_PEOPLE = 5
/** Per order of magnitude of Wikipedia editions; nudges well-known films ahead on near ties. */
const POPULARITY_BOOST = 0.04
const SEARCHED_CAST = 5

export function createSearch(index: CatalogIndex): SearchFn {
  const nameOf = (id: string) => index.people[id] ?? ''
  const movieDocs = index.movies.map((movie) => ({
    movie,
    title: foldDiacritics(movie.title),
    people: foldDiacritics(
      [...movie.directors, ...movie.cast.slice(0, SEARCHED_CAST)].map(nameOf).join(' '),
    ),
  }))
  const personDocs = [...index.credits].map(([id, credits]) => ({
    hit: { id, name: nameOf(id) || 'Unknown', credits: credits.directed.length + credits.acted.length },
    name: foldDiacritics(nameOf(id)),
  }))

  const movieFuse = new Fuse(movieDocs, {
    keys: [
      { name: 'title', weight: 0.75 },
      { name: 'people', weight: 0.25 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: MIN_QUERY_LENGTH,
  })
  const personFuse = new Fuse(personDocs, {
    keys: ['name'],
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: MIN_QUERY_LENGTH,
  })

  return (query, limit = 8) => {
    const folded = foldDiacritics(query.trim())
    if (folded.length < MIN_QUERY_LENGTH) return { movies: [], people: [] }
    const movies = movieFuse
      .search(folded)
      .map(({ item, score = 1 }) => ({
        movie: item.movie,
        rank: score - POPULARITY_BOOST * Math.log10(item.movie.popularity + 1),
      }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, limit)
      .map(({ movie }) => movie)
    const people = personFuse
      .search(folded)
      .sort((a, b) => (a.score ?? 1) - (b.score ?? 1) || b.item.hit.credits - a.item.hit.credits)
      .slice(0, Math.min(limit, MAX_PEOPLE))
      .map(({ item }) => item.hit)
    return { movies, people }
  }
}
