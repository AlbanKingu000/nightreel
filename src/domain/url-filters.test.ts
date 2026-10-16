import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS } from './filters'
import { parseBrowseParams, toBrowseParams, type BrowseState } from './url-filters'

const parse = (query: string) => parseBrowseParams(new URLSearchParams(query))

describe('parseBrowseParams', () => {
  it('defaults to no filters sorted by popularity', () => {
    expect(parse('')).toEqual({ filters: EMPTY_FILTERS, sort: 'popular' })
  })

  it('reads every supported parameter, ignoring unknown genres', () => {
    expect(parse('g=comedy,sci-fi,cooking&y=1990-2009&rt=90-150&q=star&sort=acclaimed')).toEqual({
      filters: {
        genres: ['Comedy', 'Sci-Fi'],
        yearMin: 1990,
        yearMax: 2009,
        runtimeMin: 90,
        runtimeMax: 150,
        query: 'star',
      },
      sort: 'acclaimed',
    })
  })

  it('supports open-ended ranges', () => {
    const { filters } = parse('y=1990-&rt=-100')
    expect(filters).toMatchObject({ yearMin: 1990, yearMax: null, runtimeMin: null, runtimeMax: 100 })
  })

  it('ignores invalid values', () => {
    expect(parse('sort=bogus&y=x-y')).toEqual({ filters: EMPTY_FILTERS, sort: 'popular' })
    expect(parse('sort=rating').sort).toBe('popular')
  })
})

describe('toBrowseParams', () => {
  it('omits defaults', () => {
    expect(toBrowseParams({ filters: EMPTY_FILTERS, sort: 'popular' }).toString()).toBe('')
  })

  it('round-trips a full state', () => {
    const state: BrowseState = {
      filters: {
        genres: ['Horror', 'Comedy'],
        yearMin: 1980,
        yearMax: null,
        runtimeMin: null,
        runtimeMax: 120,
        query: 'night',
      },
      sort: 'newest',
    }
    expect(parseBrowseParams(toBrowseParams(state))).toEqual(state)
  })
})
