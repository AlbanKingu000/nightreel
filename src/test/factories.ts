import type { Movie } from '../data/schema'

let counter = 0

export function makeMovie(overrides: Partial<Movie> = {}): Movie {
  counter += 1
  const id = overrides.id ?? `Q${100_000 + counter}`
  return {
    id,
    slug: `movie-${counter}-2000`,
    title: `Movie ${counter}`,
    year: 2000,
    runtime: 120,
    genres: ['Drama'],
    color: '#334455',
    directors: [],
    cast: [],
    oscars: 0,
    bestPicture: false,
    hasTrailer: false,
    popularity: 50,
    ...overrides,
  }
}
