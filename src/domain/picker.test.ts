import { describe, expect, it } from 'vitest'
import { sampleMovies } from '../test/fixtures'
import { findMood, matchesMood, MOODS } from './mood'
import { candidatesFor, pickMovie, type PickOptions } from './picker'

const movies = sampleMovies()
const byId = (id: string) => movies.find((movie) => movie.id === id)!
const options = (overrides: Partial<PickOptions>): PickOptions => ({
  moodId: 'any',
  maxRuntime: null,
  exclude: [],
  ...overrides,
})

describe('moods', () => {
  it('has unique ids and falls back to "any"', () => {
    expect(new Set(MOODS.map((mood) => mood.id)).size).toBe(MOODS.length)
    expect(findMood('nope').id).toBe('any')
  })

  it('matches by genre and era', () => {
    expect(matchesMood(byId('Q8'), findMood('cozy'))).toBe(true)
    expect(matchesMood(byId('Q5'), findMood('cozy'))).toBe(false)
    expect(matchesMood(byId('Q4'), findMood('classic'))).toBe(true)
    expect(matchesMood(byId('Q3'), findMood('classic'))).toBe(false)
  })
})

describe('candidatesFor', () => {
  it('combines mood and runtime filters', () => {
    const ids = (o: Partial<PickOptions>) => candidatesFor(movies, options(o)).map((m) => m.id)
    expect(ids({ moodId: 'spooky' })).toEqual(['Q5', 'Q10'])
    expect(ids({ moodId: 'spooky', maxRuntime: 100 })).toEqual(['Q10'])
  })
})

describe('pickMovie', () => {
  it('uses the injected random source', () => {
    expect(pickMovie(movies, options({ moodId: 'spooky' }), () => 0)?.id).toBe('Q5')
    expect(pickMovie(movies, options({ moodId: 'spooky' }), () => 0.999)?.id).toBe('Q10')
  })

  it('avoids recent picks while alternatives exist', () => {
    const pick = (rng: number) =>
      pickMovie(movies, options({ moodId: 'spooky', exclude: ['Q5'] }), () => rng)?.id
    expect([pick(0), pick(0.5), pick(0.99)]).toEqual(['Q10', 'Q10', 'Q10'])
    expect(pickMovie(movies, options({ moodId: 'spooky', exclude: ['Q5', 'Q10'] }))).not.toBeNull()
  })

  it('returns null when nothing matches', () => {
    expect(pickMovie(movies, options({ moodId: 'spooky', maxRuntime: 60 }))).toBeNull()
  })
})
