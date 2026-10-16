// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { HttpError, type HttpClient } from './http'
import { fetchSummary, parseSummary, summaryUrl, titleFromArticle } from './wikipedia'

const standard = {
  type: 'standard',
  title: 'Inception',
  extract: ' Inception is a film. ',
  thumbnail: { source: 'https://upload.wikimedia.org/t.jpg?utm_source=x' },
  originalimage: { source: 'https://upload.wikimedia.org/o.jpg?utm_source=x' },
}

describe('wikipedia helpers', () => {
  it('derives the title from an article URL', () => {
    expect(titleFromArticle('https://en.wikipedia.org/wiki/Am%C3%A9lie_(film)')).toBe(
      'Amélie (film)',
    )
  })

  it('builds the REST summary URL', () => {
    expect(summaryUrl('Amélie (film)')).toBe(
      'https://en.wikipedia.org/api/rest_v1/page/summary/Am%C3%A9lie_(film)',
    )
  })

  it('parses a standard summary and ignores any images', () => {
    expect(parseSummary(standard)).toEqual({ title: 'Inception', extract: 'Inception is a film.' })
  })

  it('returns null for disambiguation pages and malformed payloads', () => {
    expect(parseSummary({ type: 'disambiguation', title: 'X', extract: '' })).toBeNull()
    expect(parseSummary({ nope: 1 })).toBeNull()
  })
})

describe('fetchSummary', () => {
  it('parses successful responses', async () => {
    const http = { json: vi.fn().mockResolvedValue(standard) } as unknown as HttpClient
    await expect(fetchSummary(http, 'Inception')).resolves.toMatchObject({ title: 'Inception' })
  })

  it('returns null on 404 and rethrows other errors', async () => {
    const json = vi
      .fn()
      .mockRejectedValueOnce(new HttpError(404, 'u'))
      .mockRejectedValueOnce(new HttpError(500, 'u'))
    const http = { json } as unknown as HttpClient
    await expect(fetchSummary(http, 'Missing')).resolves.toBeNull()
    await expect(fetchSummary(http, 'Broken')).rejects.toBeInstanceOf(HttpError)
  })
})
