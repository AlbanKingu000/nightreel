import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export interface JsonCache {
  get<T>(key: string): Promise<T | undefined>
  set(key: string, value: unknown): Promise<void>
}

interface Entry {
  key: string
  value: unknown
}

/** File-per-key JSON cache so pipeline reruns don't hit the network again. */
export function createJsonCache(dir: string): JsonCache {
  const fileFor = (key: string) =>
    path.join(dir, `${createHash('sha1').update(key).digest('hex')}.json`)

  return {
    async get<T>(key: string): Promise<T | undefined> {
      let raw: string
      try {
        raw = await readFile(fileFor(key), 'utf8')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
        throw error
      }
      try {
        const entry = JSON.parse(raw) as Entry
        return entry.key === key ? (entry.value as T) : undefined
      } catch {
        return undefined
      }
    },
    async set(key: string, value: unknown): Promise<void> {
      await mkdir(dir, { recursive: true })
      await writeFile(fileFor(key), JSON.stringify({ key, value }))
    },
  }
}

export async function cached<T>(
  cache: JsonCache,
  key: string,
  produce: () => Promise<T>,
): Promise<T> {
  const hit = await cache.get<T>(key)
  if (hit !== undefined) return hit
  const value = await produce()
  await cache.set(key, value)
  return value
}
