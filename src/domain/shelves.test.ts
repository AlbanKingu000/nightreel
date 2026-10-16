import { describe, expect, it } from 'vitest'
import { sampleCatalog } from '../test/fixtures'
import { buildCatalogIndex } from './catalog-index'
import {
  bestPictureWinners,
  buildShelves,
  hiddenGems,
  MIN_SHELF_SIZE,
  pickFeatured,
} from './shelves'

const index = buildCatalogIndex(sampleCatalog())
const ids = (movies: ReadonlyArray<{ id: string }>) => movies.map((movie) => movie.id)

describe('shelf builders', () => {
  it('finds hidden gems: Oscar winners with a small Wikipedia footprint', () => {
    expect(ids(hiddenGems(index.movies, index.stats))).toEqual(['Q7'])
  })

  it('lists Best Picture winners newest first', () => {
    expect(ids(bestPictureWinners(index.movies))).toEqual(['Q3', 'Q4'])
  })

  it('builds home shelves, dropping ones that are too small', () => {
    const shelves = buildShelves(index)
    expect(shelves[0]?.id).toBe('popular')
    expect(shelves[1]?.id).toBe('top-rated')
    expect(ids(shelves)).toEqual(expect.arrayContaining(['recent', 'genre-drama']))
    expect(shelves.every((shelf) => shelf.movies.length >= MIN_SHELF_SIZE)).toBe(true)
    expect(shelves.every((shelf) => shelf.title.length > 0 && shelf.link.startsWith('/'))).toBe(
      true,
    )
  })
})

describe('pickFeatured', () => {
  it('is stable within a day and varies across days', () => {
    const evening = pickFeatured(index.movies, new Date(2026, 9, 8, 20))
    const morning = pickFeatured(index.movies, new Date(2026, 9, 8, 8))
    expect(evening?.id).toBe(morning?.id)
    const month = Array.from(
      { length: 30 },
      (_, day) => pickFeatured(index.movies, new Date(2026, 9, day + 1))?.id,
    )
    expect(new Set(month).size).toBeGreaterThan(1)
  })

  it('returns undefined for an empty catalog', () => {
    expect(pickFeatured([], new Date())).toBeUndefined()
  })
})
