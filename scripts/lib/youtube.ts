import { HttpError, type HttpClient } from './http'

const UNAVAILABLE_STATUS = new Set([400, 401, 403, 404])

export function oembedUrl(videoId: string): string {
  const watchUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)
  return `https://www.youtube.com/oembed?format=json&url=${watchUrl}`
}

/** Keyless check: oEmbed answers 200 only for public, embeddable videos. */
export async function isVideoAvailable(http: HttpClient, videoId: string): Promise<boolean> {
  const url = oembedUrl(videoId)
  const response = await http.fetch(url)
  await response.body?.cancel()
  if (response.ok) return true
  if (UNAVAILABLE_STATUS.has(response.status)) return false
  throw new HttpError(response.status, url)
}
