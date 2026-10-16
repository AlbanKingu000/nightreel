import type { Movie } from '../data/schema'
import type { CatalogIndex } from './catalog-index'
import { bestPictureWinners, hiddenGems } from './shelves'
import { sortMovies } from './sort'

export interface Collection {
  id: string
  title: string
  subtitle: string
  select: (index: CatalogIndex) => Movie[]
}

const SHORT_RUNTIME = 100
const EPIC_RUNTIME = 170

const byAcclaim = (index: CatalogIndex, keep: (movie: Movie) => boolean) =>
  sortMovies(index.movies.filter(keep), 'acclaimed')

/** Hand-curated lists that get their own page at /collection/:id. */
export const COLLECTIONS: readonly Collection[] = [
  {
    id: 'hidden-gems',
    title: 'Hidden gems',
    subtitle: 'Academy Award winners that fly under the radar',
    select: (index) => hiddenGems(index.movies, index.stats),
  },
  {
    id: 'best-picture',
    title: 'Best Picture winners',
    subtitle: 'Academy Award for Best Picture, newest first',
    select: (index) => bestPictureWinners(index.movies),
  },
  {
    id: 'oscar-winners',
    title: 'Oscar winners',
    subtitle: 'Films that took home at least one Academy Award',
    select: (index) => byAcclaim(index, (movie) => movie.oscars > 0),
  },
  {
    id: 'short-and-sweet',
    title: 'Short and sweet',
    subtitle: `Great films under ${SHORT_RUNTIME} minutes`,
    select: (index) => byAcclaim(index, (movie) => movie.runtime < SHORT_RUNTIME),
  },
  {
    id: 'epic-nights',
    title: 'Epic nights',
    subtitle: 'Settle in: nearly three hours or more',
    select: (index) => byAcclaim(index, (movie) => movie.runtime >= EPIC_RUNTIME),
  },
  {
    id: 'trailer-park',
    title: 'Trailer park',
    subtitle: 'Films with a trailer ready to play',
    select: (index) => sortMovies(index.movies.filter((movie) => movie.hasTrailer), 'popular'),
  },
]

export const findCollection = (id: string): Collection | undefined =>
  COLLECTIONS.find((collection) => collection.id === id)
