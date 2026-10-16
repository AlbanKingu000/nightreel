import { describe, expect, it } from 'vitest'
import { sampleMovies } from '../test/fixtures'
import { activeFilterCount, applyFilters, EMPTY_FILTERS, type Filters } from './filters'

const movies = sampleMovies()
const ids = (filters: Partial<Filters>) =>
  applyFilters(movies, { ...EMPTY_FILTERS, ...filters }).map((movie) => movie.id)

describe('applyFilters', () => {
  it('returns everything with no filters', () => {
    expect(ids({})).toHaveLength(movies.length)
  })

  it('requires every selected genre', () => {
    expect(ids({ genres: ['Comedy', 'Family'] })).toEqual(['Q8'])
  })

  it('filters by year range, keeping input order', () => {
    expect(ids({ yearMin: 2000, yearMax: 2010 })).toEqual(['Q1', 'Q2', 'Q7'])
  })

  it('filters by runtime bounds', () => {
    expect(ids({ runtimeMax: 100 })).toEqual(['Q9', 'Q10'])
    expect(ids({ runtimeMin: 170 })).toEqual(['Q3'])
  })

  it('matches title text ignoring case and accents', () => {
    expect(ids({ query: 'amelie' })).toEqual(['Q2'])
    expect(ids({ query: 'THE ' })).toEqual(['Q3', 'Q5', 'Q10'])
  })

  it('does not mutate the input', () => {
    const before = movies.map((movie) => movie.id)
    ids({ runtimeMax: 100 })
    expect(movies.map((movie) => movie.id)).toEqual(before)
  })
})

describe('activeFilterCount', () => {
  it('counts each active filter dimension once', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0)
    expect(
      activeFilterCount({ ...EMPTY_FILTERS, genres: ['Comedy', 'Drama'] }),
    ).toBe(1)
    expect(
      activeFilterCount({ ...EMPTY_FILTERS, yearMax: 1999, runtimeMin: 90, query: 'x' }),
    ).toBe(3)
  })
})
