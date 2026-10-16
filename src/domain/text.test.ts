import { describe, expect, it } from 'vitest'
import { foldDiacritics, slugify } from './text'

describe('foldDiacritics', () => {
  it('lowercases and strips accents', () => {
    expect(foldDiacritics('Amélie Poulain')).toBe('amelie poulain')
    expect(foldDiacritics('Ça')).toBe('ca')
  })
})

describe('slugify', () => {
  it('makes url-safe slugs', () => {
    expect(slugify('Christopher Nolan')).toBe('christopher-nolan')
    expect(slugify('Penélope Cruz')).toBe('penelope-cruz')
    expect(slugify("Schindler's List")).toBe('schindlers-list')
  })
})
