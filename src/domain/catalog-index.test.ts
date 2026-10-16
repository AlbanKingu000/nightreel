import { describe, expect, it } from 'vitest'
import { sampleCatalog } from '../test/fixtures'
import { buildCatalogIndex, personName } from './catalog-index'

const index = buildCatalogIndex(sampleCatalog())

describe('buildCatalogIndex', () => {
  it('indexes movies by id and slug', () => {
    expect(index.byId.get('Q1')?.title).toBe('Inception')
    expect(index.bySlug.get('amelie-2001')?.id).toBe('Q2')
  })

  it('collects credits per person', () => {
    expect(index.credits.get('Q100')).toEqual({ directed: ['Q1', 'Q6'], acted: [] })
    expect(index.credits.get('Q201')).toEqual({ directed: [], acted: ['Q1', 'Q6'] })
  })

  it('precomputes catalog stats', () => {
    expect(index.stats.gemPopularity).toBe(23)
  })

  it('resolves person names with a fallback', () => {
    expect(personName(index, 'Q100')).toBe('Christopher Nolan')
    expect(personName(index, 'Q999999')).toBe('Unknown')
  })
})
