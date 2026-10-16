import { describe, expect, it } from 'vitest'
import { sampleCatalog } from '../test/fixtures'
import { buildCatalogIndex } from './catalog-index'
import { becauseYouSaved, forYou } from './recommend'

const index = buildCatalogIndex(sampleCatalog())
const ids = (movies: ReadonlyArray<{ id: string }>) => movies.map((movie) => movie.id)

describe('forYou', () => {
  it('returns nothing without a taste profile', () => {
    expect(forYou({}, index, 5)).toEqual([])
  })

  it('recommends movies like the ones you love, excluding them', () => {
    const picks = forYou({ Q1: { favoriteAt: 1 } }, index, 3)
    expect(picks[0]?.id).toBe('Q6')
    expect(ids(picks)).not.toContain('Q1')
    expect(picks).toHaveLength(3)
  })

  it('skips movies you have already watched or rated', () => {
    const picks = forYou(
      { Q1: { favoriteAt: 1 }, Q6: { watchedAt: 2 }, Q2: { rating: 3, ratedAt: 1 } },
      index,
      10,
    )
    expect(ids(picks)).not.toContain('Q6')
    expect(ids(picks)).not.toContain('Q2')
  })

  it('does not treat dislikes as taste', () => {
    expect(forYou({ Q5: { rating: 1, ratedAt: 1 } }, index, 5)).toEqual([])
  })
})

describe('becauseYouSaved', () => {
  it('uses the most recently saved movie as the seed', () => {
    const result = becauseYouSaved({ Q2: { watchlistAt: 100 }, Q1: { watchlistAt: 200 } }, index, 4)
    expect(result?.seed.id).toBe('Q1')
    expect(result?.movies[0]?.id).toBe('Q6')
    expect(ids(result?.movies ?? [])).not.toContain('Q1')
  })

  it('returns null when nothing is saved', () => {
    expect(becauseYouSaved({ Q1: { watchedAt: 5 } }, index, 4)).toBeNull()
  })
})
