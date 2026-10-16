import { describe, expect, it } from 'vitest'
import { POSTER_VARIANTS, posterArt, titleColor, titleHash } from './poster-art'

describe('poster art', () => {
  it('is deterministic per title and differs between titles', () => {
    expect(titleHash('Inception')).toBe(titleHash('Inception'))
    expect(titleHash('Inception')).not.toBe(titleHash('Interstellar'))
    expect(posterArt('Amélie')).toEqual(posterArt('Amélie'))
  })

  it('produces a valid hex tint and an in-range variant and angle', () => {
    for (const title of ['Inception', 'Amélie', 'Airplane!', '', 'Spirited Away']) {
      expect(titleColor(title)).toMatch(/^#[0-9a-f]{6}$/)
      const { variant, angle } = posterArt(title)
      expect(variant).toBeGreaterThanOrEqual(0)
      expect(variant).toBeLessThan(POSTER_VARIANTS)
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThan(360)
    }
  })

  it('uses every pattern variant across a catalog-sized sample', () => {
    const variants = new Set(Array.from({ length: 200 }, (_, i) => posterArt(`Film ${i}`).variant))
    expect(variants.size).toBe(POSTER_VARIANTS)
  })
})
