import type { CastRef, CoreInfo, PersonRef, TopFilm, VideoRef } from './normalize'
import { groupByFilm, qidOf, type Binding } from './sparql'

const TRAILER_ROLE = 'Q622550'
const YOUTUBE_ID = /^[\w-]{11}$/
const EMPTY_CORE: CoreInfo = { label: null, dates: [], seconds: [], article: null }

function toNumber(value: string | undefined): number | null {
  if (value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const uniqueValues = (groups: Map<string, string[]>): Map<string, string[]> =>
  new Map([...groups].map(([film, values]) => [film, [...new Set(values)]]))

const uniqueById = <T extends { id: string }>(items: readonly T[]): T[] => [
  ...new Map(items.map((item) => [item.id, item])).values(),
]

export function parseTopRows(rows: readonly Binding[]): TopFilm[] {
  const byId = new Map<string, TopFilm>()
  for (const row of rows) {
    const film = row.film?.value
    const sitelinks = toNumber(row.links?.value)
    if (!film || sitelinks === null) continue
    const id = qidOf(film)
    const previous = byId.get(id)
    if (!previous || sitelinks > previous.sitelinks) byId.set(id, { id, sitelinks })
  }
  return [...byId.values()].sort((a, b) => b.sitelinks - a.sitelinks)
}

export function parseCore(rows: readonly Binding[]): Map<string, CoreInfo> {
  const result = new Map<string, CoreInfo>()
  for (const row of rows) {
    const film = row.film?.value
    if (!film) continue
    const id = qidOf(film)
    const previous = result.get(id) ?? EMPTY_CORE
    const date = row.date?.value
    const seconds = toNumber(row.seconds?.value)
    result.set(id, {
      label: previous.label ?? row.label?.value ?? null,
      dates: date && !previous.dates.includes(date) ? [...previous.dates, date] : previous.dates,
      seconds:
        seconds !== null && !previous.seconds.includes(seconds)
          ? [...previous.seconds, seconds]
          : previous.seconds,
      article: previous.article ?? row.article?.value ?? null,
    })
  }
  return result
}

export function parseLabels(rows: readonly Binding[], field: string): Map<string, string[]> {
  return uniqueValues(groupByFilm(rows, (row) => row[field]?.value))
}

export function parsePeople(rows: readonly Binding[]): Map<string, PersonRef[]> {
  const groups = groupByFilm(rows, (row): PersonRef | undefined =>
    row.person && row.name ? { id: qidOf(row.person.value), name: row.name.value } : undefined,
  )
  return new Map([...groups].map(([film, people]) => [film, uniqueById(people)]))
}

export function parseCast(rows: readonly Binding[]): Map<string, CastRef[]> {
  return groupByFilm(rows, (row): CastRef | undefined =>
    row.person && row.name
      ? {
          id: qidOf(row.person.value),
          name: row.name.value,
          ord: toNumber(row.ord?.value),
          links: toNumber(row.links?.value) ?? 0,
        }
      : undefined,
  )
}

function mergeVideos(videos: readonly VideoRef[]): VideoRef[] {
  const byId = new Map<string, VideoRef>()
  for (const video of videos) {
    const trailer = video.trailer || (byId.get(video.id)?.trailer ?? false)
    byId.set(video.id, { id: video.id, trailer })
  }
  return [...byId.values()]
}

export function parseVideos(rows: readonly Binding[]): Map<string, VideoRef[]> {
  const groups = groupByFilm(rows, (row): VideoRef | undefined => {
    const id = row.yt?.value
    if (!id || !YOUTUBE_ID.test(id)) return undefined
    return { id, trailer: row.role ? qidOf(row.role.value) === TRAILER_ROLE : false }
  })
  return new Map([...groups].map(([film, videos]) => [film, mergeVideos(videos)]))
}

export function parseAwards(rows: readonly Binding[]): Map<string, string[]> {
  return uniqueValues(groupByFilm(rows, (row) => (row.award ? qidOf(row.award.value) : undefined)))
}
