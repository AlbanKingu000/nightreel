import type { Movie } from '../data/schema'

export const SORT_KEYS = ['popular', 'acclaimed', 'newest', 'oldest', 'title', 'runtime'] as const
export type SortKey = (typeof SORT_KEYS)[number]

export const SORT_LABELS: Record<SortKey, string> = {
  popular: 'Most popular',
  acclaimed: 'Most awarded',
  newest: 'Newest first',
  oldest: 'Oldest first',
  title: 'Title A–Z',
  runtime: 'Shortest first',
}

/** Popularity = number of Wikipedia language editions (Wikidata sitelinks). */
export const byPopularity = (a: Movie, b: Movie) => b.popularity - a.popularity
const byAcclaim = (a: Movie, b: Movie) =>
  b.oscars - a.oscars || Number(b.bestPicture) - Number(a.bestPicture) || byPopularity(a, b)
const sortTitle = (title: string) => title.replace(/^(the|a|an)\s+/i, '')

export function sortMovies(movies: readonly Movie[], key: SortKey): Movie[] {
  const copy = [...movies]
  switch (key) {
    case 'popular':
      return copy.sort(byPopularity)
    case 'acclaimed':
      return copy.sort(byAcclaim)
    case 'newest':
      return copy.sort((a, b) => b.year - a.year || byPopularity(a, b))
    case 'oldest':
      return copy.sort((a, b) => a.year - b.year || byPopularity(a, b))
    case 'title':
      return copy.sort((a, b) =>
        sortTitle(a.title).localeCompare(sortTitle(b.title), 'en', { sensitivity: 'base' }),
      )
    case 'runtime':
      return copy.sort((a, b) => a.runtime - b.runtime || byPopularity(a, b))
  }
}
