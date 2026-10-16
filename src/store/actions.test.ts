import { describe, expect, it } from 'vitest'
import { recordSpin, setRating, setReview, toggleFlag } from './actions'
import { EMPTY_USER_DATA, type UserData } from './userSchema'

describe('toggleFlag', () => {
  it('adds and removes a flag without mutating the input', () => {
    const added = toggleFlag(EMPTY_USER_DATA, 'Q1', 'watchlistAt', 100)
    expect(added.entries.Q1).toEqual({ watchlistAt: 100 })
    expect(EMPTY_USER_DATA.entries).toEqual({})
    expect(toggleFlag(added, 'Q1', 'watchlistAt', 200).entries.Q1).toBeUndefined()
  })

  it('punches the ticket: marking watched removes the movie from the watchlist', () => {
    const saved = toggleFlag(EMPTY_USER_DATA, 'Q1', 'watchlistAt', 100)
    expect(toggleFlag(saved, 'Q1', 'watchedAt', 200).entries.Q1).toEqual({ watchedAt: 200 })
  })

  it('keeps other fields when unflagging', () => {
    const rated = setRating(EMPTY_USER_DATA, 'Q1', 4, 50)
    const faved = toggleFlag(rated, 'Q1', 'favoriteAt', 60)
    expect(toggleFlag(faved, 'Q1', 'favoriteAt', 70).entries.Q1).toEqual({ rating: 4, ratedAt: 50 })
  })
})

describe('setRating', () => {
  it('rounds to half stars within 0.5-5 and clears with null', () => {
    expect(setRating(EMPTY_USER_DATA, 'Q1', 4.3, 1).entries.Q1).toEqual({ rating: 4.5, ratedAt: 1 })
    expect(setRating(EMPTY_USER_DATA, 'Q1', 9, 1).entries.Q1?.rating).toBe(5)
    expect(setRating(EMPTY_USER_DATA, 'Q1', 0.1, 1).entries.Q1?.rating).toBe(0.5)
    const cleared = setRating(setRating(EMPTY_USER_DATA, 'Q1', 3, 1), 'Q1', null, 2)
    expect(cleared.entries.Q1).toBeUndefined()
  })
})

describe('setReview', () => {
  it('trims, caps at 1000 characters and removes empty reviews', () => {
    const long = 'x'.repeat(1200)
    expect(setReview(EMPTY_USER_DATA, 'Q1', `  ${long}  `, 5).entries.Q1?.review).toEqual({
      text: 'x'.repeat(1000),
      updatedAt: 5,
    })
    const cleared = setReview(setReview(EMPTY_USER_DATA, 'Q1', 'Great', 1), 'Q1', '   ', 2)
    expect(cleared.entries.Q1).toBeUndefined()
  })
})

describe('recordSpin', () => {
  it('keeps the 20 most recent unique picks, newest first', () => {
    const ids = Array.from({ length: 22 }, (_, i) => `Q${i + 1}`)
    const spun = [...ids, 'Q5'].reduce<UserData>((data, id) => recordSpin(data, id), EMPTY_USER_DATA)
    expect(spun.spinHistory).toHaveLength(20)
    expect(spun.spinHistory[0]).toBe('Q5')
    expect(spun.spinHistory.filter((id) => id === 'Q5')).toHaveLength(1)
  })
})
