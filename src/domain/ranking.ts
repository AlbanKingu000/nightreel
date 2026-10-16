import type { Movie } from '../data/schema'

export interface CatalogStats {
  /** Upper popularity bound for "hidden gems" (30th percentile of Wikipedia language editions). */
  gemPopularity: number
}

export function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0
  return sorted[Math.floor((sorted.length - 1) * q)] ?? 0
}

export function catalogStats(movies: readonly Movie[]): CatalogStats {
  const popularity = movies.map((movie) => movie.popularity).sort((a, b) => a - b)
  return { gemPopularity: quantile(popularity, 0.3) }
}
