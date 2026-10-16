import { describe, expect, it } from 'vitest'
import { mergeUserData, parseUserDataFile, serializeUserData } from './io'
import type { UserData } from './userSchema'

const data: UserData = {
  version: 1,
  entries: {
    Q1: { watchlistAt: 10 },
    Q2: { rating: 4, ratedAt: 20, review: { text: 'Lovely', updatedAt: 20 } },
  },
  spinHistory: ['Q1'],
}

describe('serializeUserData / parseUserDataFile', () => {
  it('round-trips through the export format', () => {
    const text = serializeUserData(data, new Date('2026-10-08T00:00:00Z'))
    expect(JSON.parse(text)).toMatchObject({
      format: 'nightreel-user-data',
      exportedAt: '2026-10-08T00:00:00.000Z',
    })
    expect(parseUserDataFile(text)).toEqual({ ok: true, data })
  })

  it.each([
    ['broken JSON', '{oops'],
    ['another format', JSON.stringify({ format: 'other', data })],
    [
      'invalid entries',
      JSON.stringify({
        format: 'nightreel-user-data',
        exportedAt: 'x',
        data: { version: 1, entries: { Q1: { rating: 99 } }, spinHistory: [] },
      }),
    ],
  ])('rejects %s with a readable error', (_label, text) => {
    const result = parseUserDataFile(text)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0)
  })
})

describe('mergeUserData', () => {
  it('unions entries and keeps the newest value of each field', () => {
    const current: UserData = {
      version: 1,
      entries: { Q1: { watchlistAt: 10, rating: 2, ratedAt: 5 }, Q3: { favoriteAt: 1 } },
      spinHistory: ['Q1', 'Q3'],
    }
    const incoming: UserData = {
      version: 1,
      entries: { Q1: { watchedAt: 30, rating: 5, ratedAt: 40 }, Q2: { watchlistAt: 7 } },
      spinHistory: ['Q2', 'Q1'],
    }
    expect(mergeUserData(current, incoming)).toEqual({
      version: 1,
      entries: {
        Q1: { watchlistAt: 10, watchedAt: 30, rating: 5, ratedAt: 40 },
        Q2: { watchlistAt: 7 },
        Q3: { favoriteAt: 1 },
      },
      spinHistory: ['Q2', 'Q1', 'Q3'],
    })
  })

  it('keeps the newer review', () => {
    const older: UserData = {
      version: 1,
      entries: { Q1: { review: { text: 'old', updatedAt: 1 } } },
      spinHistory: [],
    }
    const newer: UserData = {
      version: 1,
      entries: { Q1: { review: { text: 'new', updatedAt: 2 } } },
      spinHistory: [],
    }
    expect(mergeUserData(newer, older).entries.Q1?.review?.text).toBe('new')
  })
})
