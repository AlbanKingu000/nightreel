// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import type { HttpClient } from './http'
import {
  awardsQuery,
  castQuery,
  coreQuery,
  countriesQuery,
  directorsQuery,
  genresQuery,
  topFilmsQuery,
  videosQuery,
} from './queries'
import { chunk, groupByFilm, parseBindings, qidOf, runSparql, valuesBlock } from './sparql'

const uri = (q: string) => ({ type: 'uri', value: `http://www.wikidata.org/entity/${q}` })
const lit = (value: string) => ({ type: 'literal', value })

describe('sparql helpers', () => {
  it('extracts the QID from an entity URI', () => {
    expect(qidOf('http://www.wikidata.org/entity/Q25188')).toBe('Q25188')
  })

  it('builds a VALUES block and rejects anything that is not a QID', () => {
    expect(valuesBlock(['Q1', 'Q2'])).toBe('VALUES ?film { wd:Q1 wd:Q2 }')
    expect(() => valuesBlock(['Q1', 'x } DROP'])).toThrow()
  })

  it('chunks arrays', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('parses result bindings and rejects malformed payloads', () => {
    const json = { head: { vars: ['film'] }, results: { bindings: [{ film: uri('Q1') }] } }
    expect(parseBindings(json)).toEqual([{ film: uri('Q1') }])
    expect(() => parseBindings({ nope: true })).toThrow()
  })

  it('groups rows by film, skipping rows the picker drops', () => {
    const rows = [
      { film: uri('Q1'), g: lit('drama film') },
      { film: uri('Q1'), g: lit('war film') },
      { film: uri('Q2') },
    ]
    const grouped = groupByFilm(rows, (b) => b.g?.value)
    expect(grouped.get('Q1')).toEqual(['drama film', 'war film'])
    expect(grouped.has('Q2')).toBe(false)
  })
})

describe('runSparql', () => {
  it('sends the query to the Wikidata endpoint and returns bindings', async () => {
    const json = vi.fn().mockResolvedValue({
      head: { vars: [] },
      results: { bindings: [{ film: uri('Q7') }] },
    })
    const http = { json } as unknown as HttpClient
    const rows = await runSparql(http, 'SELECT * WHERE {}')
    expect(rows).toHaveLength(1)
    const [url, init] = json.mock.calls[0]!
    expect(url).toContain('https://query.wikidata.org/sparql?query=SELECT')
    expect(init.headers.Accept).toBe('application/sparql-results+json')
  })
})

describe('queries', () => {
  it('restricts every detail query to the given films', () => {
    const builders = [
      coreQuery,
      genresQuery,
      directorsQuery,
      castQuery,
      videosQuery,
      awardsQuery,
      countriesQuery,
    ]
    for (const build of builders) {
      expect(build(['Q1', 'Q2'])).toContain('VALUES ?film { wd:Q1 wd:Q2 }')
    }
  })

  it('filters top films by type and sitelinks', () => {
    expect(topFilmsQuery('Q11424', 35)).toMatch(/wd:Q11424[\s\S]*>= 35/)
    expect(() => topFilmsQuery('bad', 35)).toThrow()
  })
})
