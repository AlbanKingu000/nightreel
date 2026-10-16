import { describe, expect, it } from 'vitest'
import { sampleCatalog } from '../test/fixtures'
import { buildCatalogIndex } from './catalog-index'
import { createSearch } from './search'

const search = createSearch(buildCatalogIndex(sampleCatalog()))

describe('createSearch', () => {
  it('finds movies by partial title', () => {
    expect(search('incept').movies[0]?.id).toBe('Q1')
  })

  it('ignores accents', () => {
    expect(search('amelie').movies[0]?.id).toBe('Q2')
  })

  it('tolerates typos', () => {
    expect(search('godfathr').movies[0]?.id).toBe('Q3')
  })

  it('finds people and their movies', () => {
    const results = search('nolan')
    expect(results.people[0]).toMatchObject({ id: 'Q100', name: 'Christopher Nolan', credits: 2 })
    expect(results.movies.map((movie) => movie.id)).toEqual(expect.arrayContaining(['Q1', 'Q6']))
  })

  it('returns nothing for very short or blank queries', () => {
    expect(search('a')).toEqual({ movies: [], people: [] })
    expect(search('   ')).toEqual({ movies: [], people: [] })
  })

  it('respects the limit', () => {
    expect(search('the', 2).movies.length).toBeLessThanOrEqual(2)
  })
})
