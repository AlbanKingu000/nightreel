import { describe, expect, it } from 'vitest'
import { sampleCatalog } from '../test/fixtures'
import { buildCatalogIndex } from './catalog-index'
import { COLLECTIONS, findCollection } from './collections'

const index = buildCatalogIndex(sampleCatalog())
const ids = (collectionId: string) =>
  findCollection(collectionId)
    ?.select(index)
    .map((movie) => movie.id)

describe('collections', () => {
  it('have unique ids', () => {
    expect(new Set(COLLECTIONS.map((c) => c.id)).size).toBe(COLLECTIONS.length)
  })

  it('select the right movies', () => {
    expect(ids('hidden-gems')).toEqual(['Q7'])
    expect(ids('best-picture')).toEqual(['Q3', 'Q4'])
    expect(ids('oscar-winners')).toEqual(['Q1', 'Q3', 'Q4', 'Q6', 'Q7'])
    expect(ids('short-and-sweet')).toEqual(['Q9', 'Q10'])
    expect(ids('epic-nights')).toEqual(['Q3'])
    expect(ids('trailer-park')).toEqual(['Q1'])
  })

  it('returns undefined for unknown ids', () => {
    expect(findCollection('nope')).toBeUndefined()
  })
})
