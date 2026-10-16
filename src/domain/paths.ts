import { GENRES, type Genre, type Movie } from '../data/schema'
import { slugify } from './text'

export const moviePath = (movie: Pick<Movie, 'slug'>): string => `/movie/${movie.slug}`

export function personPath(id: string, name: string): string {
  const slug = slugify(name)
  return slug ? `/person/${id}-${slug}` : `/person/${id}`
}

export const parsePersonKey = (key: string): string | null => /^(Q\d+)(?:-|$)/.exec(key)?.[1] ?? null

export const genreSlug = (genre: Genre): string => genre.toLowerCase()

export const genrePath = (genre: Genre): string => `/genre/${genreSlug(genre)}`

export const genreFromSlug = (slug: string): Genre | undefined =>
  GENRES.find((genre) => genre.toLowerCase() === slug.toLowerCase())

export const collectionPath = (id: string): string => `/collection/${id}`
