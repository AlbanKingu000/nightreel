import { describe, expect, it } from 'vitest'
import { createSafeStorage } from './safeStorage'

describe('createSafeStorage', () => {
  it('uses the real storage when it works', () => {
    const storage = createSafeStorage(() => localStorage)
    storage.setItem('k', 'v')
    expect(localStorage.getItem('k')).toBe('v')
    expect(storage.getItem('k')).toBe('v')
    expect(storage.available).toBe(true)
    storage.removeItem('k')
    expect(storage.getItem('k')).toBeNull()
  })

  it('falls back to memory when storage cannot be opened', () => {
    const storage = createSafeStorage(() => {
      throw new Error('SecurityError')
    })
    storage.setItem('k', 'v')
    expect(storage.getItem('k')).toBe('v')
    expect(storage.available).toBe(false)
  })

  it('falls back to memory when writes fail', () => {
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {},
    } as unknown as Storage
    const storage = createSafeStorage(() => broken)
    storage.setItem('k', 'v')
    expect(storage.getItem('k')).toBe('v')
    expect(storage.available).toBe(false)
  })

  it('lists keys with a prefix', () => {
    const storage = createSafeStorage(() => localStorage)
    storage.setItem('a:1', 'x')
    storage.setItem('b:1', 'y')
    expect(storage.keys('a:')).toEqual(['a:1'])
  })
})
