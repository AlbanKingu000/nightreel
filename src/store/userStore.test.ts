import { describe, expect, it } from 'vitest'
import { createSafeStorage } from './safeStorage'
import { createUserStore, STORAGE_KEY } from './userStore'

const newStore = () => createUserStore(createSafeStorage(() => localStorage))
const backups = () =>
  Object.keys(localStorage).filter((key) => key.startsWith(`${STORAGE_KEY}:corrupt-`))

describe('user store', () => {
  it('persists actions to localStorage', () => {
    const store = newStore()
    store.getState().toggleWatchlist('Q1')
    store.getState().setRating('Q1', 4)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(saved.version).toBe(1)
    expect(saved.state.entries.Q1).toMatchObject({ watchlistAt: expect.any(Number), rating: 4 })
  })

  it('restores saved data on startup', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { version: 1, entries: { Q2: { favoriteAt: 5 } }, spinHistory: [] },
        version: 1,
      }),
    )
    expect(newStore().getState().entries).toEqual({ Q2: { favoriteAt: 5 } })
  })

  it.each([
    [
      'an invalid shape',
      JSON.stringify({ state: { version: 1, entries: { bad: 1 }, spinHistory: [] }, version: 1 }),
    ],
    ['broken JSON', '{oops'],
  ])('backs up %s and starts fresh', (_label, raw) => {
    localStorage.setItem(STORAGE_KEY, raw)
    expect(newStore().getState().entries).toEqual({})
    expect(backups()).toHaveLength(1)
  })

  it('supports every list action', () => {
    const store = newStore()
    const { toggleWatched, toggleFavorite, setReview, recordSpin } = store.getState()
    toggleWatched('Q1')
    toggleFavorite('Q1')
    setReview('Q1', 'Loved it')
    recordSpin('Q1')
    const state = store.getState()
    expect(state.entries.Q1).toMatchObject({ watchedAt: expect.any(Number), review: { text: 'Loved it' } })
    expect(state.spinHistory).toEqual(['Q1'])
  })

  it('imports with merge or replace, and resets', () => {
    const store = newStore()
    store.getState().toggleFavorite('Q1')
    store.getState().importData({ version: 1, entries: { Q2: { watchlistAt: 1 } }, spinHistory: [] }, 'merge')
    expect(Object.keys(store.getState().entries).sort()).toEqual(['Q1', 'Q2'])
    store.getState().importData({ version: 1, entries: { Q3: { watchlistAt: 1 } }, spinHistory: [] }, 'replace')
    expect(Object.keys(store.getState().entries)).toEqual(['Q3'])
    store.getState().reset()
    expect(store.getState().entries).toEqual({})
  })
})
