import { describe, expect, it } from 'vitest'
import { sampleCatalog } from '../test/fixtures'
import { buildCatalogIndex } from './catalog-index'
import { userStats } from './stats'

const index = buildCatalogIndex(sampleCatalog())

describe('userStats', () => {
  it('summarizes watched time, ratings and taste', () => {
    const entries = {
      Q1: { watchedAt: 1 },
      Q3: { watchedAt: 2, rating: 5, ratedAt: 2 },
      Q6: { watchedAt: 3 },
      Q2: { rating: 4, ratedAt: 3, review: { text: 'Charming', updatedAt: 3 } },
      Q4: { watchlistAt: 4 },
      Q5: { favoriteAt: 5 },
      Q999: { watchedAt: 9 },
    }
    expect(userStats(entries, index.byId)).toEqual({
      watchedCount: 3,
      minutesWatched: 492,
      hoursWatched: 8.2,
      ratedCount: 2,
      averageRating: 4.5,
      reviewsCount: 1,
      ticketsCount: 1,
      favoritesCount: 1,
      topGenres: [
        { genre: 'Drama', count: 2 },
        { genre: 'Sci-Fi', count: 2 },
        { genre: 'Action', count: 1 },
      ],
      topDecades: [
        { decade: '2010s', count: 2 },
        { decade: '1970s', count: 1 },
      ],
    })
  })

  it('handles an empty list', () => {
    expect(userStats({}, index.byId)).toMatchObject({
      watchedCount: 0,
      hoursWatched: 0,
      averageRating: null,
      topGenres: [],
    })
  })
})
