import { describe, expect, it } from 'vitest'
import { makeMovie } from '../test/factories'
import { similarity, topSimilar } from './similarity'

const base = makeMovie({
  id: 'Q1',
  genres: ['Sci-Fi', 'Action'],
  directors: ['Q100'],
  cast: ['Q200', 'Q201', 'Q202'],
  year: 2010,
})

describe('similarity', () => {
  it('scores a movie identical in every respect near the max', () => {
    const twin = { ...base, id: 'Q2' }
    expect(similarity(base, twin)).toBeCloseTo(1, 5)
  })

  it('weights shared genres and director above era', () => {
    const sameDirector = makeMovie({
      genres: ['Sci-Fi', 'Action'],
      directors: ['Q100'],
      year: 1980,
    })
    const sameEra = makeMovie({ genres: ['Romance'], directors: ['Q999'], year: 2010 })
    expect(similarity(base, sameDirector)).toBeGreaterThan(similarity(base, sameEra))
  })

  it('handles movies without genres or cast', () => {
    const empty = () => makeMovie({ genres: [], cast: [], directors: [] })
    expect(similarity(empty(), empty())).toBeGreaterThanOrEqual(0)
  })
})

describe('topSimilar', () => {
  it('excludes the movie itself, sorts by score then popularity, and limits', () => {
    const a = makeMovie({ id: 'Q10', genres: ['Sci-Fi', 'Action'], directors: ['Q100'], year: 2010 })
    const b = makeMovie({ id: 'Q11', genres: ['Romance'], year: 1950 })
    const c1 = makeMovie({ id: 'Q12', genres: ['Sci-Fi'], year: 2010, popularity: 10 })
    const c2 = makeMovie({ id: 'Q13', genres: ['Sci-Fi'], year: 2010, popularity: 500 })
    expect(topSimilar(base, [base, a, b, c1, c2], 3)).toEqual(['Q10', 'Q13', 'Q12'])
  })
})
