import { describe, expect, it } from 'vitest'
import {
  justWatchUrl,
  wikidataUrl,
  youtubeEmbedUrl,
  youtubeSearchUrl,
  youtubeWatchUrl,
} from './links'

describe('external links', () => {
  it('builds encoded search links', () => {
    expect(youtubeSearchUrl('Amélie', 2001)).toBe(
      'https://www.youtube.com/results?search_query=Am%C3%A9lie%202001%20official%20trailer',
    )
    expect(justWatchUrl('The Godfather')).toBe(
      'https://www.justwatch.com/us/search?q=The%20Godfather',
    )
  })

  it('builds video and reference links', () => {
    expect(youtubeWatchUrl('YoHD9XEInc0')).toBe('https://www.youtube.com/watch?v=YoHD9XEInc0')
    expect(youtubeEmbedUrl('YoHD9XEInc0')).toBe(
      'https://www.youtube-nocookie.com/embed/YoHD9XEInc0?autoplay=1&rel=0',
    )
    expect(wikidataUrl('Q25188')).toBe('https://www.wikidata.org/wiki/Q25188')
  })
})
