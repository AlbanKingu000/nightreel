import type { Movie } from '../data/schema'

const WEIGHTS = { genres: 0.4, director: 0.2, cast: 0.2, era: 0.2 } as const
const ERA_SPAN_YEARS = 30
const CAST_WINDOW = 5

function jaccard(a: readonly string[], b: readonly string[]): number {
  const union = new Set([...a, ...b]).size
  if (union === 0) return 0
  const setB = new Set(b)
  return a.filter((item) => setB.has(item)).length / union
}

function overlapRatio(a: readonly string[], b: readonly string[]): number {
  const denominator = Math.min(CAST_WINDOW, a.length, b.length)
  if (denominator === 0) return 0
  const setB = new Set(b)
  return Math.min(1, a.filter((item) => setB.has(item)).length / denominator)
}

/** Score in [0, 1] describing how much `b` resembles `a` (weighted towards genre and crew). */
export function similarity(a: Movie, b: Movie): number {
  const sharesDirector = a.directors.some((id) => b.directors.includes(id)) ? 1 : 0
  const era = Math.max(0, 1 - Math.abs(a.year - b.year) / ERA_SPAN_YEARS)
  return (
    WEIGHTS.genres * jaccard(a.genres, b.genres) +
    WEIGHTS.director * sharesDirector +
    WEIGHTS.cast * overlapRatio(a.cast, b.cast) +
    WEIGHTS.era * era
  )
}

export function topSimilar(movie: Movie, pool: readonly Movie[], limit = 12): string[] {
  return pool
    .filter((candidate) => candidate.id !== movie.id)
    .map((candidate) => ({ candidate, score: similarity(movie, candidate) }))
    .sort((x, y) => y.score - x.score || y.candidate.popularity - x.candidate.popularity)
    .slice(0, limit)
    .map(({ candidate }) => candidate.id)
}
