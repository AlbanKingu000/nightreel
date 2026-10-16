import { describe, expect, it } from 'vitest'
import { sampleMovies } from '../test/fixtures'
import { catalogStats, quantile } from './ranking'

describe('quantile', () => {
  it('reads from a sorted list and handles empty input', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.25)).toBe(2)
    expect(quantile([], 0.5)).toBe(0)
  })
})

describe('catalogStats', () => {
  it('computes the hidden-gem popularity threshold', () => {
    expect(catalogStats(sampleMovies()).gemPopularity).toBe(23)
    expect(catalogStats([]).gemPopularity).toBe(0)
  })
})
