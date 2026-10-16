/** Outbound links. None of these need keys; they open in a new tab. */

export const youtubeSearchUrl = (title: string, year: number): string =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year} official trailer`)}`

export const youtubeWatchUrl = (videoId: string): string =>
  `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`

export const youtubeEmbedUrl = (videoId: string): string =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`

export const justWatchUrl = (title: string): string =>
  `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`

export const wikidataUrl = (id: string): string => `https://www.wikidata.org/wiki/${id}`
