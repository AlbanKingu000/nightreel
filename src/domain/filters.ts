import type { Genre, Movie } from '../data/schema'
import { foldDiacritics } from './text'

export interface Filters {
  genres: Genre[]
  yearMin: number | null
  yearMax: number | null
  runtimeMin: number | null
  runtimeMax: number | null
  query: string
}

export const EMPTY_FILTERS: Filters = {
  genres: [],
  yearMin: null,
  yearMax: null,
  runtimeMin: null,
  runtimeMax: null,
  query: '',
}

const inRange = (value: number, min: number | null, max: number | null) =>
  (min === null || value >= min) && (max === null || value <= max)

export function applyFilters(movies: readonly Movie[], filters: Filters): Movie[] {
  const query = foldDiacritics(filters.query.trim())
  return movies.filter(
    (movie) =>
      filters.genres.every((genre) => movie.genres.includes(genre)) &&
      inRange(movie.year, filters.yearMin, filters.yearMax) &&
      inRange(movie.runtime, filters.runtimeMin, filters.runtimeMax) &&
      (query === '' || foldDiacritics(movie.title).includes(query)),
  )
}

export function activeFilterCount(filters: Filters): number {
  return [
    filters.genres.length > 0,
    filters.yearMin !== null || filters.yearMax !== null,
    filters.runtimeMin !== null || filters.runtimeMax !== null,
    filters.query.trim() !== '',
  ].filter(Boolean).length
}
