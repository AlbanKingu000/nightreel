import { describe, expect, it } from 'vitest'
import { makeMovie } from '../test/factories'
import { genreFromSlug, genrePath, moviePath, parsePersonKey, personPath } from './paths'

describe('paths', () => {
  it('builds movie paths from slugs', () => {
    expect(moviePath(makeMovie({ slug: 'inception-2010' }))).toBe('/movie/inception-2010')
  })

  it('builds person paths with a readable suffix when possible', () => {
    expect(personPath('Q100', 'Christopher Nolan')).toBe('/person/Q100-christopher-nolan')
    expect(personPath('Q9', '東京')).toBe('/person/Q9')
  })

  it('parses the person id back out of the key', () => {
    expect(parsePersonKey('Q100-christopher-nolan')).toBe('Q100')
    expect(parsePersonKey('Q100')).toBe('Q100')
    expect(parsePersonKey('nolan')).toBeNull()
  })

  it('maps genres to and from url slugs', () => {
    expect(genrePath('Sci-Fi')).toBe('/genre/sci-fi')
    expect(genreFromSlug('SCI-FI')).toBe('Sci-Fi')
    expect(genreFromSlug('cooking')).toBeUndefined()
  })
})
