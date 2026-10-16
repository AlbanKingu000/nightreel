import type { Genre, Movie } from '../data/schema'
import type { CatalogIndex } from './catalog-index'
import { collectionPath, genrePath, genreSlug } from './paths'
import type { CatalogStats } from './ranking'
import { sortMovies } from './sort'

export interface Shelf {
  id: string
  title: string
  subtitle: string
  link: string
  movies: Movie[]
}

export const MIN_SHELF_SIZE = 4
const RECENT_WINDOW_YEARS = 8
const FEATURED_POOL = 40

const GENRE_SHELVES: ReadonlyArray<{ genre: Genre; title: string; subtitle: string }> = [
  { genre: 'Sci-Fi', title: 'Beyond the stars', subtitle: 'Science fiction' },
  { genre: 'Comedy', title: 'Laugh track', subtitle: 'Comedies' },
  { genre: 'Crime', title: 'After hours', subtitle: 'Crime and noir' },
  { genre: 'Horror', title: 'Midnight screams', subtitle: 'Horror' },
  { genre: 'Animation', title: 'Hand-drawn and pixel-perfect', subtitle: 'Animation' },
  { genre: 'Romance', title: 'Back-row romance', subtitle: 'Romance' },
  { genre: 'Drama', title: 'Heavy hitters', subtitle: 'Drama' },
  { genre: 'War', title: 'Frontlines', subtitle: 'War' },
  { genre: 'Thriller', title: 'Pulse pounders', subtitle: 'Thrillers' },
  { genre: 'Fantasy', title: 'Once upon a reel', subtitle: 'Fantasy' },
  { genre: 'Western', title: 'Dust and gunsmoke', subtitle: 'Westerns' },
  { genre: 'Music', title: 'Turn it up', subtitle: 'Musicals and music' },
]

const DECADE_SHELVES = [1970, 1980, 1990, 2000] as const

/** Academy Award winners with a smaller footprint on Wikipedia than most of the catalog. */
export function hiddenGems(movies: readonly Movie[], stats: CatalogStats): Movie[] {
  return movies
    .filter((movie) => movie.oscars > 0 && movie.popularity <= stats.gemPopularity)
    .sort((a, b) => b.oscars - a.oscars || a.popularity - b.popularity)
}

export function bestPictureWinners(movies: readonly Movie[]): Movie[] {
  return movies.filter((movie) => movie.bestPicture).sort((a, b) => b.year - a.year)
}

function recentReleases(movies: readonly Movie[]): Movie[] {
  const newest = movies.reduce((max, movie) => Math.max(max, movie.year), 0)
  const recent = movies.filter((movie) => movie.year >= newest - RECENT_WINDOW_YEARS)
  return sortMovies(recent, 'popular')
}

function genreShelves(index: CatalogIndex): Shelf[] {
  return GENRE_SHELVES.map(({ genre, title, subtitle }) => ({
    id: `genre-${genreSlug(genre)}`,
    title,
    subtitle,
    link: genrePath(genre),
    movies: sortMovies(
      index.movies.filter((movie) => movie.genres.includes(genre)),
      'acclaimed',
    ),
  }))
}

function decadeShelves(index: CatalogIndex): Shelf[] {
  return DECADE_SHELVES.map((start) => ({
    id: `decade-${start}`,
    title: `Rewind: the ${start}s`,
    subtitle: `Best of ${start}–${start + 9}`,
    link: `/browse?y=${start}-${start + 9}&sort=acclaimed`,
    movies: sortMovies(
      index.movies.filter((movie) => movie.year >= start && movie.year <= start + 9),
      'acclaimed',
    ),
  }))
}

/** Interleaves two lists so genre and decade rows alternate on the home page. */
function interleave<T>(a: readonly T[], b: readonly T[]): T[] {
  return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => [a[i], b[i]])
    .flat()
    .filter((item): item is T => item !== undefined)
}

/** All home-page shelves, in display order. Each shelf holds its full list; the UI trims. */
export function buildShelves(index: CatalogIndex): Shelf[] {
  const { movies, stats } = index
  const fixed: Shelf[] = [
    { id: 'popular', title: 'Now showing', subtitle: 'The most widely covered films on the reel', link: '/browse', movies: sortMovies(movies, 'popular') },
    { id: 'top-rated', title: "Critics' row", subtitle: 'The most Academy Awards', link: '/browse?sort=acclaimed', movies: sortMovies(movies, 'acclaimed') },
    { id: 'recent', title: 'Fresh off the reel', subtitle: 'Recent releases', link: '/browse?sort=newest', movies: recentReleases(movies) },
    { id: 'hidden-gems', title: 'Hidden gems', subtitle: 'Oscar winners that fly under the radar', link: collectionPath('hidden-gems'), movies: hiddenGems(movies, stats) },
    { id: 'best-picture', title: 'Best Picture winners', subtitle: 'Academy Award for Best Picture', link: collectionPath('best-picture'), movies: bestPictureWinners(movies) },
  ]
  return [...fixed, ...interleave(genreShelves(index), decadeShelves(index))].filter(
    (shelf) => shelf.movies.length >= MIN_SHELF_SIZE,
  )
}

function dayHash(date: Date): number {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  let hash = 2166136261
  for (const char of key) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** "Tonight's feature": an award-winning film chosen deterministically per calendar day. */
export function pickFeatured(movies: readonly Movie[], date: Date): Movie | undefined {
  const pool = sortMovies(movies, 'acclaimed').slice(0, FEATURED_POOL)
  if (pool.length === 0) return undefined
  return pool[dayHash(date) % pool.length]
}
