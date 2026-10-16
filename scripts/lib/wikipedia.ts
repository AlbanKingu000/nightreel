import { z } from 'zod'
import { HttpError, type HttpClient } from './http'

export interface WikiSummary {
  title: string
  extract: string
}

const summarySchema = z.object({
  type: z.string(),
  title: z.string(),
  extract: z.string(),
})

const WIKI_PATH = '/wiki/'

export function titleFromArticle(articleUrl: string): string {
  const segment = articleUrl.slice(articleUrl.indexOf(WIKI_PATH) + WIKI_PATH.length)
  return decodeURIComponent(segment).replace(/_/g, ' ')
}

export function summaryUrl(title: string): string {
  const slug = encodeURIComponent(title.replace(/ /g, '_'))
  return `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`
}

export function parseSummary(json: unknown): WikiSummary | null {
  const parsed = summarySchema.safeParse(json)
  if (!parsed.success || parsed.data.type !== 'standard') return null
  const { title, extract } = parsed.data
  return { title, extract: extract.trim() }
}

export async function fetchSummary(http: HttpClient, title: string): Promise<WikiSummary | null> {
  try {
    return parseSummary(await http.json(summaryUrl(title)))
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null
    throw error
  }
}
