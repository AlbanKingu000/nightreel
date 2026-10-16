/**
 * Builds the static movie catalog from keyless open data:
 * Wikidata (facts, CC0), Wikipedia (overview, CC BY-SA 4.0), YouTube oEmbed (trailer check).
 * Poster art is generated in the browser from each title, so no images are downloaded.
 * Run with `npm run data`. Raw responses are cached under .cache/ so reruns are cheap.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import pLimit from 'p-limit'
import {
  catalogSchema,
  movieDetailSchema,
  type Catalog,
  type Movie,
  type MovieDetail,
} from '../src/data/schema'
import { topSimilar } from '../src/domain/similarity'
import { cached, createJsonCache, type JsonCache } from './lib/cache'
import { createHttp, type HttpClient } from './lib/http'
import {
  orderCast,
  rejectReason,
  toDetail,
  toMovie,
  type CastRef,
  type CoreInfo,
  type FilmBundle,
  type PersonRef,
  type TopFilm,
  type VideoRef,
} from './lib/normalize'
import {
  parseAwards,
  parseCast,
  parseCore,
  parseLabels,
  parsePeople,
  parseTopRows,
  parseVideos,
} from './lib/parse'
import * as queries from './lib/queries'
import { assignSlugs } from './lib/slug'
import { chunk, runSparql, type Binding } from './lib/sparql'
import { fetchSummary, titleFromArticle, type WikiSummary } from './lib/wikipedia'
import { isVideoAvailable } from './lib/youtube'

const ROOT = path.resolve(import.meta.dirname, '..')
const CACHE_DIR = path.join(ROOT, '.cache')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const USER_AGENT = 'Nightreel/0.1 (personal movie discovery site; Node.js)'
const FILM_TYPES = ['Q11424', 'Q202866'] // film, animated film (see ANIMATED_FILM)
const MIN_SITELINKS = 35
const CANDIDATE_LIMIT = 1100
const BATCH_SIZE = 50
const SMALL_BATCH = 10
const MIN_MOVIES = 500
const SIMILAR_COUNT = 12

interface Details {
  core: Map<string, CoreInfo>
  genres: Map<string, string[]>
  directors: Map<string, PersonRef[]>
  cast: Map<string, CastRef[]>
  videos: Map<string, VideoRef[]>
  awards: Map<string, string[]>
  countries: Map<string, string[]>
}

interface Sources {
  details: Details
  summaries: Map<string, WikiSummary | null>
  alive: ReadonlySet<string>
}

const log = (message: string) => console.log(`[data] ${message}`)

async function safely<T>(label: string, fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    console.warn(`[data] ${label} failed: ${String(error)}`)
    return fallback
  }
}

const sparql = (http: HttpClient, cache: JsonCache, query: string) =>
  cached(cache, `sparql:${query}`, () => runSparql(http, query))

const ANIMATED_FILM = 'Q202866'

/** Top films, plus the ids typed as animated films (Wikidata often omits "animation" from their genres). */
async function loadTopFilms(
  http: HttpClient,
  cache: JsonCache,
): Promise<{ films: TopFilm[]; animated: Set<string> }> {
  const rows: Binding[] = []
  const animated = new Set<string>()
  for (const type of FILM_TYPES) {
    const typeRows = await sparql(http, cache, queries.topFilmsQuery(type, MIN_SITELINKS))
    if (type === ANIMATED_FILM) parseTopRows(typeRows).forEach((film) => animated.add(film.id))
    rows.push(...typeRows)
  }
  return { films: parseTopRows(rows).slice(0, CANDIDATE_LIMIT), animated }
}

/** Runs one detail query for a batch, splitting the batch if Wikidata times out. */
async function batchRows(
  http: HttpClient,
  cache: JsonCache,
  build: (ids: readonly string[]) => string,
  ids: readonly string[],
): Promise<Binding[]> {
  try {
    return await sparql(http, cache, build(ids))
  } catch (error) {
    if (ids.length <= SMALL_BATCH) throw error
    log(`  batch of ${ids.length} failed (${String(error)}); retrying in smaller batches`)
    const rows: Binding[] = []
    for (const part of chunk(ids, SMALL_BATCH)) rows.push(...(await batchRows(http, cache, build, part)))
    return rows
  }
}

async function loadDetails(http: HttpClient, cache: JsonCache, ids: string[]): Promise<Details> {
  const builders = {
    core: queries.coreQuery,
    genres: queries.genresQuery,
    directors: queries.directorsQuery,
    cast: queries.castQuery,
    videos: queries.videosQuery,
    awards: queries.awardsQuery,
    countries: queries.countriesQuery,
  }
  const rows = Object.fromEntries(Object.keys(builders).map((key) => [key, [] as Binding[]])) as Record<
    keyof typeof builders,
    Binding[]
  >
  const batches = chunk(ids, BATCH_SIZE)
  for (const [index, batch] of batches.entries()) {
    log(`wikidata details ${index + 1}/${batches.length}`)
    for (const key of Object.keys(builders) as Array<keyof typeof builders>) {
      rows[key].push(...(await batchRows(http, cache, builders[key], batch)))
    }
  }
  return {
    core: parseCore(rows.core),
    genres: parseLabels(rows.genres, 'label'),
    directors: parsePeople(rows.directors),
    cast: parseCast(rows.cast),
    videos: parseVideos(rows.videos),
    awards: parseAwards(rows.awards),
    countries: parseLabels(rows.countries, 'name'),
  }
}

async function loadSummaries(
  http: HttpClient,
  cache: JsonCache,
  films: readonly TopFilm[],
  core: Map<string, CoreInfo>,
): Promise<Map<string, WikiSummary | null>> {
  const limit = pLimit(3)
  let done = 0
  const entries = await Promise.all(
    films.map((film) =>
      limit(async () => {
        const article = core.get(film.id)?.article
        const summary = article
          ? await safely(`summary ${film.id}`, null, () =>
              cached(cache, `wiki:${article}`, () => fetchSummary(http, titleFromArticle(article))),
            )
          : null
        done += 1
        if (done % 100 === 0) log(`wikipedia summaries ${done}/${films.length}`)
        return [film.id, summary] as const
      }),
    ),
  )
  return new Map(entries)
}

async function loadAliveVideos(
  http: HttpClient,
  cache: JsonCache,
  ids: readonly string[],
): Promise<Set<string>> {
  const limit = pLimit(4)
  const statuses = await Promise.all(
    ids.map((id) =>
      limit(async () => {
        const ok = await safely(`video ${id}`, false, () =>
          cached(cache, `youtube:${id}`, () => isVideoAvailable(http, id)),
        )
        return [id, ok] as const
      }),
    ),
  )
  return new Set(statuses.filter(([, ok]) => ok).map(([id]) => id))
}

function bundleFor(film: TopFilm, sources: Sources): FilmBundle {
  const { details } = sources
  return {
    top: film,
    core: details.core.get(film.id) ?? { label: null, dates: [], seconds: [], article: null },
    genres: details.genres.get(film.id) ?? [],
    directors: details.directors.get(film.id) ?? [],
    cast: details.cast.get(film.id) ?? [],
    videos: details.videos.get(film.id) ?? [],
    awards: details.awards.get(film.id) ?? [],
    countries: details.countries.get(film.id) ?? [],
    summary: sources.summaries.get(film.id) ?? null,
    aliveVideos: sources.alive,
  }
}

function partition(bundles: readonly FilmBundle[]) {
  const accepted: FilmBundle[] = []
  const rejected = new Map<string, number>()
  for (const bundle of bundles) {
    const reason = rejectReason(bundle)
    if (reason === null) accepted.push(bundle)
    else rejected.set(reason, (rejected.get(reason) ?? 0) + 1)
  }
  return { accepted, rejected }
}

function collectPeople(bundles: readonly FilmBundle[]): Record<string, string> {
  const people = bundles.flatMap((b) => [...b.directors, ...orderCast(b.cast)])
  return Object.fromEntries(people.map((person) => [person.id, person.name]))
}

function assemble(bundles: readonly FilmBundle[]): { catalog: Catalog; details: MovieDetail[] } {
  const sorted = [...bundles].sort((a, b) => b.top.sitelinks - a.top.sitelinks)
  const drafts = sorted.map((bundle) => ({ bundle, movie: toMovie(bundle, 'draft') }))
  const slugs = assignSlugs(drafts.map(({ movie }) => movie))
  const entries = drafts.map(({ bundle, movie }) => ({
    bundle,
    movie: { ...movie, slug: slugs.get(movie.id) ?? movie.slug },
  }))
  const movies: Movie[] = entries.map(({ movie }) => movie)
  const details = entries.map(({ bundle, movie }) =>
    toDetail(bundle, topSimilar(movie, movies, SIMILAR_COUNT)),
  )
  const catalog: Catalog = {
    version: 1,
    generatedAt: new Date().toISOString(),
    people: collectPeople(sorted),
    movies,
  }
  return { catalog, details }
}

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>()
  const dupes = values.filter((value) => seen.has(value) || !seen.add(value))
  if (dupes.length > 0) throw new Error(`Duplicate ${label}: ${dupes.slice(0, 5).join(', ')}`)
}

function validate(catalog: Catalog, details: readonly MovieDetail[]): void {
  catalogSchema.parse(catalog)
  details.forEach((detail) => movieDetailSchema.parse(detail))
  if (catalog.movies.length < MIN_MOVIES) {
    throw new Error(`Only ${catalog.movies.length} movies; need at least ${MIN_MOVIES}`)
  }
  assertUnique(catalog.movies.map((movie) => movie.id), 'ids')
  assertUnique(catalog.movies.map((movie) => movie.slug), 'slugs')
}

async function removeStale(dir: string, keep: ReadonlySet<string>): Promise<void> {
  for (const name of await readdir(dir)) {
    if (!keep.has(name)) await rm(path.join(dir, name))
  }
}

async function writeOutputs(catalog: Catalog, details: readonly MovieDetail[]): Promise<void> {
  const detailDir = path.join(DATA_DIR, 'details')
  await mkdir(detailDir, { recursive: true })
  await writeFile(path.join(DATA_DIR, 'catalog.json'), JSON.stringify(catalog))
  const limit = pLimit(32)
  await Promise.all(
    details.map((detail) =>
      limit(() => writeFile(path.join(detailDir, `${detail.id}.json`), JSON.stringify(detail))),
    ),
  )
  await removeStale(detailDir, new Set(details.map((detail) => `${detail.id}.json`)))
}

function buildReport(
  candidates: number,
  rejected: Map<string, number>,
  catalog: Catalog,
  details: readonly MovieDetail[],
) {
  const genres: Record<string, number> = {}
  for (const movie of catalog.movies) {
    for (const genre of movie.genres) genres[genre] = (genres[genre] ?? 0) + 1
  }
  const years = catalog.movies.map((movie) => movie.year)
  return {
    generatedAt: catalog.generatedAt,
    candidates,
    accepted: catalog.movies.length,
    rejected: Object.fromEntries(rejected),
    people: Object.keys(catalog.people).length,
    withTrailer: details.filter((detail) => detail.trailer !== null).length,
    bestPictureWinners: catalog.movies.filter((movie) => movie.bestPicture).length,
    years: { min: Math.min(...years), max: Math.max(...years) },
    genres,
  }
}

async function main(): Promise<void> {
  const started = Date.now()
  const http = createHttp({ userAgent: USER_AGENT })
  const wikidata = createHttp({ userAgent: USER_AGENT, minIntervalMs: 1000 })
  const cache = createJsonCache(path.join(CACHE_DIR, 'raw'))

  const { films: top, animated } = await loadTopFilms(wikidata, cache)
  log(`candidates: ${top.length} (${animated.size} typed as animated)`)
  const fetched = await loadDetails(wikidata, cache, top.map((film) => film.id))
  const details: Details = {
    ...fetched,
    genres: new Map(
      top.map((film) => {
        const labels = fetched.genres.get(film.id) ?? []
        return [film.id, animated.has(film.id) ? [...labels, 'animated film'] : labels]
      }),
    ),
  }
  const summaries = await loadSummaries(http, cache, top, details.core)
  const { accepted, rejected } = partition(top.map((film) => bundleFor(film, { details, summaries, alive: new Set() })))
  const videoIds = [...new Set(accepted.flatMap((bundle) => bundle.videos.map((video) => video.id)))]
  log(`checking ${videoIds.length} trailer videos`)
  const alive = await loadAliveVideos(http, cache, videoIds)

  const { catalog, details: movieDetails } = assemble(
    accepted.map((bundle) => ({ ...bundle, aliveVideos: alive })),
  )
  validate(catalog, movieDetails)
  await writeOutputs(catalog, movieDetails)
  const report = buildReport(top.length, rejected, catalog, movieDetails)
  await writeFile(path.join(ROOT, 'data-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  const seconds = Math.round((Date.now() - started) / 1000)
  log(`done: ${catalog.movies.length} movies in ${seconds}s`)
}

main().catch((error: unknown) => {
  console.error('[data] failed:', error)
  process.exitCode = 1
})
