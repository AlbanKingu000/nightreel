import type { Genre, Movie } from '../data/schema'
import type { UserEntry } from '../store/userSchema'
import { decadeLabel } from './format'

export interface UserStats {
  watchedCount: number
  minutesWatched: number
  hoursWatched: number
  ratedCount: number
  averageRating: number | null
  reviewsCount: number
  ticketsCount: number
  favoritesCount: number
  topGenres: Array<{ genre: Genre; count: number }>
  topDecades: Array<{ decade: string; count: number }>
}

const TOP_LIMIT = 3

const roundOne = (value: number) => Math.round(value * 10) / 10

function topCounts<T extends string>(values: readonly T[]): Array<[T, number]> {
  const counts = new Map<T, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TOP_LIMIT)
}

export function userStats(
  entries: Readonly<Record<string, UserEntry>>,
  byId: ReadonlyMap<string, Movie>,
): UserStats {
  const known = Object.entries(entries).flatMap(([id, entry]) => {
    const movie = byId.get(id)
    return movie ? [{ movie, entry }] : []
  })
  const watched = known.filter(({ entry }) => entry.watchedAt !== undefined).map(({ movie }) => movie)
  const ratings = known.flatMap(({ entry }) => (entry.rating === undefined ? [] : [entry.rating]))
  const minutes = watched.reduce((sum, movie) => sum + movie.runtime, 0)
  const ratingSum = ratings.reduce((sum, rating) => sum + rating, 0)
  return {
    watchedCount: watched.length,
    minutesWatched: minutes,
    hoursWatched: roundOne(minutes / 60),
    ratedCount: ratings.length,
    averageRating: ratings.length === 0 ? null : roundOne(ratingSum / ratings.length),
    reviewsCount: known.filter(({ entry }) => entry.review !== undefined).length,
    ticketsCount: known.filter(({ entry }) => entry.watchlistAt !== undefined).length,
    favoritesCount: known.filter(({ entry }) => entry.favoriteAt !== undefined).length,
    topGenres: topCounts(watched.flatMap((movie) => movie.genres)).map(([genre, count]) => ({
      genre,
      count,
    })),
    topDecades: topCounts(watched.map((movie) => decadeLabel(movie.year))).map(
      ([decade, count]) => ({ decade, count }),
    ),
  }
}
