// @vitest-environment node
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { cached, createJsonCache } from './cache'

const tempDir = () => mkdtemp(path.join(tmpdir(), 'nr-cache-'))

describe('createJsonCache', () => {
  it('round-trips values including null and reports misses as undefined', async () => {
    const cache = createJsonCache(await tempDir())
    expect(await cache.get('k')).toBeUndefined()
    await cache.set('k', { a: 1 })
    expect(await cache.get('k')).toEqual({ a: 1 })
    await cache.set('n', null)
    expect(await cache.get('n')).toBeNull()
  })

  it('creates the cache directory on first write', async () => {
    const cache = createJsonCache(path.join(await tempDir(), 'nested', 'dir'))
    await cache.set('k', 1)
    expect(await cache.get('k')).toBe(1)
  })
})

describe('cached', () => {
  it('only calls the producer on a miss', async () => {
    const cache = createJsonCache(await tempDir())
    const produce = vi.fn().mockResolvedValue(42)
    expect(await cached(cache, 'x', produce)).toBe(42)
    expect(await cached(cache, 'x', produce)).toBe(42)
    expect(produce).toHaveBeenCalledTimes(1)
  })
})
