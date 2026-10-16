import { describe, expect, it } from 'vitest'
import { sampleMovies } from '../test/fixtures'
import { sortMovies, type SortKey } from './sort'

const movies = sampleMovies()
const firstIds = (key: SortKey, count = 3) =>
  sortMovies(movies, key)
    .slice(0, count)
    .map((movie) => movie.id)

describe('sortMovies', () => {
  it.each<[SortKey, string[]]>([
    ['popular', ['Q1', 'Q6', 'Q3']],
    ['acclaimed', ['Q1', 'Q3', 'Q4']],
    ['newest', ['Q8', 'Q6', 'Q10']],
    ['oldest', ['Q4', 'Q3', 'Q5']],
    ['runtime', ['Q9', 'Q10', 'Q4']],
  ])('sorts by %s', (key, expected) => {
    expect(firstIds(key)).toEqual(expected)
  })

  it('sorts titles alphabetically ignoring leading articles', () => {
    expect(firstIds('title', 4)).toEqual(['Q9', 'Q2', 'Q10', 'Q4'])
  })

  it('returns a new array', () => {
    const sorted = sortMovies(movies, 'acclaimed')
    expect(sorted).not.toBe(movies)
    expect(movies[0]?.id).toBe('Q1')
  })
})
