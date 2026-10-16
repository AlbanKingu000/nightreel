// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import type { HttpClient } from './http'
import { isVideoAvailable, oembedUrl } from './youtube'

const httpReturning = (status: number) =>
  ({
    fetch: vi.fn().mockResolvedValue(new Response(status === 200 ? '{}' : '', { status })),
  }) as unknown as HttpClient

describe('youtube', () => {
  it('builds the oEmbed URL', () => {
    expect(oembedUrl('YoHD9XEInc0')).toBe(
      'https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DYoHD9XEInc0',
    )
  })

  it.each([
    [200, true],
    [400, false],
    [401, false],
    [403, false],
    [404, false],
  ])('treats status %i as available=%s', async (status, expected) => {
    await expect(isVideoAvailable(httpReturning(status), 'YoHD9XEInc0')).resolves.toBe(expected)
  })

  it('throws on unexpected statuses', async () => {
    await expect(isVideoAvailable(httpReturning(500), 'YoHD9XEInc0')).rejects.toMatchObject({
      status: 500,
    })
  })
})
