import type { Genre, Movie, MovieDetail, Trailer } from '../../src/data/schema'
import { titleColor } from '../../src/domain/poster-art'
import { mapGenres } from './genre-map'
import type { WikiSummary } from './wikipedia'

export interface TopFilm {
  id: string
  sitelinks: number
}

export interface CoreInfo {
  label: string | null
  dates: string[]
  seconds: number[]
  article: string | null
}

export interface PersonRef {
  id: string
  name: string
}

export interface CastRef extends PersonRef {
  ord: number | null
  links: number
}

export interface VideoRef {
  id: string
  trailer: boolean
}

/** Everything collected about one film before it becomes a catalog entry. */
export interface FilmBundle {
  top: TopFilm
  core: CoreInfo
  genres: string[]
  directors: PersonRef[]
  cast: CastRef[]
  videos: VideoRef[]
  awards: string[]
  countries: string[]
  summary: WikiSummary | null
  aliveVideos: ReadonlySet<string>
}

export const CATALOG_CAST_LIMIT = 10
const MIN_RUNTIME = 40
const MAX_RUNTIME = 300
const BEST_PICTURE = 'Q102427'
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})T/

export function pickRuntime(seconds: readonly number[]): number | null {
  const minutes = seconds
    .map((value) => Math.round(value / 60))
    .filter((value) => value >= MIN_RUNTIME && value <= MAX_RUNTIME)
    .sort((a, b) => a - b)
  return minutes[Math.floor((minutes.length - 1) / 2)] ?? null
}

export function pickReleaseDate(dates: readonly string[]): string | null {
  const valid = dates
    .map((date) => ISO_DATE.exec(date))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => `${match[1]}-${match[2]}-${match[3]}`)
    .sort()
  return valid[0] ?? null
}

function compareCast(a: CastRef, b: CastRef): number {
  if (a.ord !== null && b.ord !== null) return a.ord - b.ord
  if (a.ord !== null) return -1
  if (b.ord !== null) return 1
  return b.links - a.links
}

/** Billed actors first (by billing order), then the rest by fame. */
export function orderCast(cast: readonly CastRef[], limit = CATALOG_CAST_LIMIT): PersonRef[] {
  const seen = new Set<string>()
  const ordered: PersonRef[] = []
  for (const member of [...cast].sort(compareCast)) {
    if (seen.has(member.id)) continue
    seen.add(member.id)
    ordered.push({ id: member.id, name: member.name })
  }
  return ordered.slice(0, limit)
}

export function pickTrailer(
  videos: readonly VideoRef[],
  alive: ReadonlySet<string>,
): Trailer | null {
  const live = videos.filter((video) => alive.has(video.id))
  const best = live.find((video) => video.trailer) ?? live[0]
  return best ? { youtubeId: best.id, kind: best.trailer ? 'trailer' : 'video' } : null
}

export function summarizeAwards(awards: readonly string[]): {
  oscars: number
  bestPicture: boolean
} {
  const unique = new Set(awards)
  return { oscars: unique.size, bestPicture: unique.has(BEST_PICTURE) }
}

export function rejectReason(b: FilmBundle): string | null {
  if (!b.core.label) return 'no-title'
  if (!b.core.article) return 'no-article'
  if (pickReleaseDate(b.core.dates) === null) return 'no-year'
  if (pickRuntime(b.core.seconds) === null) return 'no-runtime'
  if (!b.summary) return 'no-summary'
  if (mapGenres(b.genres).length === 0) return 'no-genres'
  return null
}

interface CompleteFilm {
  title: string
  article: string
  releaseDate: string
  runtime: number
  summary: WikiSummary
  genres: Genre[]
}

function complete(b: FilmBundle): CompleteFilm {
  const reason = rejectReason(b)
  const releaseDate = pickReleaseDate(b.core.dates)
  const runtime = pickRuntime(b.core.seconds)
  const { label, article } = b.core
  const { summary } = b
  if (reason || !label || !article || !releaseDate || !runtime || !summary) {
    throw new Error(`Cannot build ${b.top.id}: ${reason ?? 'incomplete'}`)
  }
  const genres = mapGenres(b.genres)
  return { title: label, article, releaseDate, runtime, summary, genres }
}

export function toMovie(b: FilmBundle, slug: string): Movie {
  const film = complete(b)
  const awards = summarizeAwards(b.awards)
  return {
    id: b.top.id,
    slug,
    title: film.title,
    year: Number(film.releaseDate.slice(0, 4)),
    runtime: film.runtime,
    genres: film.genres,
    color: titleColor(film.title),
    directors: [...new Set(b.directors.map((director) => director.id))],
    cast: orderCast(b.cast).map((member) => member.id),
    oscars: awards.oscars,
    bestPicture: awards.bestPicture,
    hasTrailer: pickTrailer(b.videos, b.aliveVideos) !== null,
    popularity: b.top.sitelinks,
  }
}

export function toDetail(b: FilmBundle, similar: readonly string[]): MovieDetail {
  const film = complete(b)
  return {
    id: b.top.id,
    overview: film.summary.extract,
    releaseDate: film.releaseDate,
    countries: [...new Set(b.countries)],
    trailer: pickTrailer(b.videos, b.aliveVideos),
    wikipedia: film.article,
    similar: [...similar],
  }
}
