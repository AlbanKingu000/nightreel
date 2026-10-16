import type { Movie } from '../data/schema'
import { findMood, matchesMood } from './mood'

export interface PickOptions {
  moodId: string
  maxRuntime: number | null
  /** Recently picked ids to avoid repeating, when alternatives exist. */
  exclude: readonly string[]
}

export type Rng = () => number

export function candidatesFor(movies: readonly Movie[], options: PickOptions): Movie[] {
  const mood = findMood(options.moodId)
  return movies.filter(
    (movie) =>
      matchesMood(movie, mood) &&
      (options.maxRuntime === null || movie.runtime <= options.maxRuntime),
  )
}

export function pickMovie(
  movies: readonly Movie[],
  options: PickOptions,
  rng: Rng = Math.random,
): Movie | null {
  const pool = candidatesFor(movies, options)
  const excluded = new Set(options.exclude)
  const fresh = pool.filter((movie) => !excluded.has(movie.id))
  const source = fresh.length > 0 ? fresh : pool
  if (source.length === 0) return null
  const index = Math.min(source.length - 1, Math.floor(rng() * source.length))
  return source[index] ?? null
}
