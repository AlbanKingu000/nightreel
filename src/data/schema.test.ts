import { describe, expect, it } from 'vitest'
import { makeMovie } from '../test/factories'
import { catalogSchema, movieDetailSchema } from './schema'

const validCatalog = {
  version: 1,
  generatedAt: '2026-10-08T12:00:00.000Z',
  people: { Q100: 'Christopher Nolan' },
  movies: [makeMovie({ id: 'Q1', directors: ['Q100'] })],
}

const validDetail = {
  id: 'Q1',
  overview: 'A heist inside dreams.',
  releaseDate: '2010-07-08',
  countries: ['United States'],
  trailer: { youtubeId: 'YoHD9XEInc0', kind: 'trailer' },
  wikipedia: 'https://en.wikipedia.org/wiki/Inception',
  similar: ['Q2'],
}

describe('catalogSchema', () => {
  it('accepts a valid catalog', () => {
    expect(catalogSchema.parse(validCatalog)).toEqual(validCatalog)
  })

  it('drops legacy rating and poster fields', () => {
    const legacy = { ...validCatalog.movies[0], rating: 8.8, votes: 100, poster: '/posters/Q1.webp' }
    const [movie] = catalogSchema.parse({ ...validCatalog, movies: [legacy] }).movies
    expect(movie).not.toHaveProperty('rating')
    expect(movie).not.toHaveProperty('votes')
    expect(movie).not.toHaveProperty('poster')
  })

  it.each<[string, Record<string, unknown>]>([
    ['bad id', { id: 'tt123' }],
    ['bad slug', { slug: 'Bad Slug' }],
    ['bad color', { color: 'red' }],
    ['bad genre', { genres: ['Cooking'] }],
    ['runtime too short', { runtime: 5 }],
    ['negative popularity', { popularity: -1 }],
  ])('rejects %s', (_label, override) => {
    const movies = [{ ...validCatalog.movies[0], ...override }]
    expect(catalogSchema.safeParse({ ...validCatalog, movies }).success).toBe(false)
  })
})

describe('movieDetailSchema', () => {
  it('accepts details with or without a trailer and release date', () => {
    expect(movieDetailSchema.parse(validDetail)).toEqual(validDetail)
    const bare = { ...validDetail, trailer: null, releaseDate: null }
    expect(movieDetailSchema.parse(bare)).toEqual(bare)
  })

  it('rejects malformed youtube ids', () => {
    const badTrailer = { ...validDetail, trailer: { youtubeId: 'short', kind: 'trailer' } }
    expect(movieDetailSchema.safeParse(badTrailer).success).toBe(false)
  })
})
