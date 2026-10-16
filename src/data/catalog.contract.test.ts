// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { titleColor } from '../domain/poster-art'
import { catalogSchema, movieDetailSchema } from './schema'

/** Checks the real generated data (run `npm run data` first). */
const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'))
const rawCatalog = readFileSync(path.join(PUBLIC_DIR, 'data', 'catalog.json'), 'utf8')
const catalog = catalogSchema.parse(JSON.parse(rawCatalog))

describe('generated catalog', () => {
  it('has at least 500 movies', () => {
    expect(catalog.movies.length).toBeGreaterThanOrEqual(500)
  })

  it('has unique ids and slugs', () => {
    expect(new Set(catalog.movies.map((m) => m.id)).size).toBe(catalog.movies.length)
    expect(new Set(catalog.movies.map((m) => m.slug)).size).toBe(catalog.movies.length)
  })

  it('names every referenced person', () => {
    const missing = catalog.movies.flatMap((m) => [...m.directors, ...m.cast]).filter((id) => !catalog.people[id])
    expect(missing).toEqual([])
  })

  it('has valid details and a title-derived tint for every movie', () => {
    for (const movie of catalog.movies) {
      expect(movie.color).toBe(titleColor(movie.title))
      const detail = movieDetailSchema.strict().parse(readJson(path.join(PUBLIC_DIR, 'data', 'details', `${movie.id}.json`)))
      expect(detail.id).toBe(movie.id)
    }
  })

  it('ships no IMDb data or poster references', () => {
    expect(rawCatalog).not.toMatch(/"(rating|votes|poster|imdbId)"/)
    for (const movie of catalog.movies) expect(Object.keys(movie)).not.toContain('rating')
  })
})
