import { z } from 'zod'
import type { HttpClient } from './http'

export const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql'

const valueSchema = z.object({ type: z.string(), value: z.string() }).loose()
const resultsSchema = z.object({
  results: z.object({ bindings: z.array(z.record(z.string(), valueSchema)) }),
})

export type SparqlValue = z.infer<typeof valueSchema>
export type Binding = Readonly<Record<string, SparqlValue | undefined>>

const QID = /^Q\d+$/

export const qidOf = (uri: string): string => uri.slice(uri.lastIndexOf('/') + 1)

export function valuesBlock(ids: readonly string[]): string {
  const invalid = ids.find((id) => !QID.test(id))
  if (invalid !== undefined) throw new Error(`Not a Wikidata id: ${invalid}`)
  return `VALUES ?film { ${ids.map((id) => `wd:${id}`).join(' ')} }`
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size))
  }
  return chunks
}

export function parseBindings(json: unknown): Binding[] {
  return resultsSchema.parse(json).results.bindings
}

export async function runSparql(http: HttpClient, query: string): Promise<Binding[]> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`
  const json = await http.json(url, { headers: { Accept: 'application/sparql-results+json' } })
  return parseBindings(json)
}

/** Groups rows by the `?film` binding; rows where `pick` returns undefined are skipped. */
export function groupByFilm<T>(
  rows: readonly Binding[],
  pick: (row: Binding) => T | undefined,
): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const row of rows) {
    const film = row.film?.value
    const value = pick(row)
    if (film === undefined || value === undefined) continue
    const id = qidOf(film)
    groups.set(id, [...(groups.get(id) ?? []), value])
  }
  return groups
}
