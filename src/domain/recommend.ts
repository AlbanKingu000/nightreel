import type { Movie } from '../data/schema'
import type { UserEntry } from '../store/userSchema'
import { moviesByIds, type CatalogIndex } from './catalog-index'
import { topSimilar } from './similarity'

export type Entries = Readonly<Record<string, UserEntry>>

const LOVED_RATING = 4
const DISLIKED_RATING = 2
const AFFINITY = { genre: 0.5, director: 0.25, cast: 0.15, acclaim: 0.1 } as const
const ACCLAIM_CAP = 3

interface Profile {
  genres: Map<string, number>
  genreTotal: number
  directors: Set<string>
  cast: Set<string>
}

function seedWeight(entry: UserEntry): number {
  if (entry.rating !== undefined && entry.rating <= DISLIKED_RATING) return 0
  const loved = entry.rating !== undefined && entry.rating >= LOVED_RATING
  return (entry.favoriteAt ? 2 : 0) + (loved ? 2 : 0) + (entry.watchlistAt ? 1 : 0)
}

function buildProfile(entries: Entries, index: CatalogIndex): Profile | null {
  const seeds = Object.entries(entries).flatMap(([id, entry]) => {
    const movie = index.byId.get(id)
    const weight = seedWeight(entry)
    return movie && weight > 0 ? [{ movie, weight }] : []
  })
  if (seeds.length === 0) return null
  const genres = new Map<string, number>()
  for (const { movie, weight } of seeds) {
    movie.genres.forEach((genre) => genres.set(genre, (genres.get(genre) ?? 0) + weight))
  }
  return {
    genres,
    genreTotal: [...genres.values()].reduce((sum, weight) => sum + weight, 0),
    directors: new Set(seeds.flatMap(({ movie }) => movie.directors)),
    cast: new Set(seeds.flatMap(({ movie }) => movie.cast)),
  }
}

function affinity(movie: Movie, profile: Profile): number {
  const genreScore =
    profile.genreTotal === 0
      ? 0
      : movie.genres.reduce((sum, genre) => sum + (profile.genres.get(genre) ?? 0), 0) /
        profile.genreTotal
  const director = movie.directors.some((id) => profile.directors.has(id)) ? 1 : 0
  const cast = Math.min(1, movie.cast.filter((id) => profile.cast.has(id)).length / 2)
  return (
    AFFINITY.genre * genreScore +
    AFFINITY.director * director +
    AFFINITY.cast * cast +
    AFFINITY.acclaim * Math.min(1, movie.oscars / ACCLAIM_CAP)
  )
}

/** Movies you haven't touched yet, ranked by how well they fit what you saved, loved or rated. */
export function forYou(entries: Entries, index: CatalogIndex, limit: number): Movie[] {
  const profile = buildProfile(entries, index)
  if (!profile) return []
  return index.movies
    .filter((movie) => entries[movie.id] === undefined)
    .map((movie) => ({ movie, score: affinity(movie, profile) }))
    .sort((a, b) => b.score - a.score || b.movie.popularity - a.movie.popularity)
    .slice(0, limit)
    .map(({ movie }) => movie)
}

export function becauseYouSaved(
  entries: Entries,
  index: CatalogIndex,
  limit: number,
): { seed: Movie; movies: Movie[] } | null {
  const latest = Object.entries(entries)
    .map(([id, entry]) => ({ id, at: Math.max(entry.watchlistAt ?? 0, entry.favoriteAt ?? 0) }))
    .filter(({ id, at }) => at > 0 && index.byId.has(id))
    .sort((a, b) => b.at - a.at)[0]
  const seed = latest ? index.byId.get(latest.id) : undefined
  if (!seed) return null
  const unseen = topSimilar(seed, index.movies, limit * 2).filter(
    (id) => entries[id]?.watchedAt === undefined,
  )
  return { seed, movies: moviesByIds(index, unseen.slice(0, limit)) }
}
