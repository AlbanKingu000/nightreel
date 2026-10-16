import type { Genre } from '../data/schema'
import { EMPTY_FILTERS, type Filters } from './filters'
import { genreFromSlug, genreSlug } from './paths'
import { SORT_KEYS, type SortKey } from './sort'

export interface BrowseState {
  filters: Filters
  sort: SortKey
}

export const DEFAULT_SORT: SortKey = 'popular'
const YEAR_BOUNDS = [1880, 2100] as const
const RUNTIME_BOUNDS = [1, 400] as const

type Range = [number | null, number | null]

function parseRange(value: string | null, [min, max]: readonly [number, number]): Range {
  const match = value ? /^(\d*)-(\d*)$/.exec(value) : null
  if (!match) return [null, null]
  const read = (part: string | undefined) => {
    if (!part) return null
    const parsed = Number(part)
    return parsed >= min && parsed <= max ? parsed : null
  }
  return [read(match[1]), read(match[2])]
}

function parseGenres(value: string | null): Genre[] {
  const genres = (value ?? '')
    .split(',')
    .map((slug) => genreFromSlug(slug.trim()))
    .filter((genre): genre is Genre => genre !== undefined)
  return [...new Set(genres)]
}

const isSortKey = (value: string | null): value is SortKey =>
  SORT_KEYS.some((key) => key === value)

export function parseBrowseParams(params: URLSearchParams): BrowseState {
  const [yearMin, yearMax] = parseRange(params.get('y'), YEAR_BOUNDS)
  const [runtimeMin, runtimeMax] = parseRange(params.get('rt'), RUNTIME_BOUNDS)
  const sort = params.get('sort')
  return {
    filters: {
      ...EMPTY_FILTERS,
      genres: parseGenres(params.get('g')),
      yearMin,
      yearMax,
      runtimeMin,
      runtimeMax,
      query: params.get('q')?.trim() ?? '',
    },
    sort: isSortKey(sort) ? sort : DEFAULT_SORT,
  }
}

const formatRange = (min: number | null, max: number | null) =>
  min === null && max === null ? null : `${min ?? ''}-${max ?? ''}`

export function toBrowseParams({ filters, sort }: BrowseState): URLSearchParams {
  const entries: Array<[string, string | null]> = [
    ['g', filters.genres.length > 0 ? filters.genres.map(genreSlug).join(',') : null],
    ['y', formatRange(filters.yearMin, filters.yearMax)],
    ['rt', formatRange(filters.runtimeMin, filters.runtimeMax)],
    ['q', filters.query.trim() || null],
    ['sort', sort === DEFAULT_SORT ? null : sort],
  ]
  return new URLSearchParams(
    entries.filter((entry): entry is [string, string] => entry[1] !== null),
  )
}
