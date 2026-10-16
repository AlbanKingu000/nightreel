// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  parseAwards,
  parseCast,
  parseCore,
  parseLabels,
  parsePeople,
  parseTopRows,
  parseVideos,
} from './parse'

const uri = (q: string) => ({ type: 'uri', value: `http://www.wikidata.org/entity/${q}` })
const lit = (value: string) => ({ type: 'literal', value })
const num = (value: number) => ({ type: 'literal', value: String(value) })
const article = (title: string) => ({ type: 'uri', value: `https://en.wikipedia.org/wiki/${title}` })

describe('parseTopRows', () => {
  it('dedupes films, takes max sitelinks, skips rows without sitelinks, and sorts by popularity', () => {
    const rows = [
      { film: uri('Q1'), links: num(50) },
      { film: uri('Q1'), links: num(60) },
      { film: uri('Q1'), links: num(55) },
      { film: uri('Q2'), links: num(90) },
      { film: uri('Q4') },
    ]
    expect(parseTopRows(rows)).toEqual([
      { id: 'Q2', sitelinks: 90 },
      { id: 'Q1', sitelinks: 60 },
    ])
  })
})

describe('parseCore', () => {
  it('collects unique dates and runtimes, the label and the article per film', () => {
    const rows = [
      {
        film: uri('Q1'),
        label: lit('Inception'),
        date: lit('2010-07-16T00:00:00Z'),
        seconds: num(8880),
        article: article('Inception'),
      },
      {
        film: uri('Q1'),
        label: lit('Inception'),
        date: lit('2010-07-08T00:00:00Z'),
        seconds: num(8880),
        article: article('Inception'),
      },
      { film: uri('Q2') },
    ]
    const core = parseCore(rows)
    expect(core.get('Q1')).toEqual({
      label: 'Inception',
      dates: ['2010-07-16T00:00:00Z', '2010-07-08T00:00:00Z'],
      seconds: [8880],
      article: 'https://en.wikipedia.org/wiki/Inception',
    })
    expect(core.get('Q2')).toEqual({ label: null, dates: [], seconds: [], article: null })
  })
})

describe('parseLabels', () => {
  it('groups unique labels from the named field', () => {
    const rows = [
      { film: uri('Q1'), name: lit('France') },
      { film: uri('Q1'), name: lit('France') },
      { film: uri('Q1'), name: lit('Italy') },
    ]
    expect(parseLabels(rows, 'name').get('Q1')).toEqual(['France', 'Italy'])
  })
})

describe('parsePeople', () => {
  it('groups unique people with names', () => {
    const rows = [
      { film: uri('Q1'), person: uri('Q10'), name: lit('Agnès Varda') },
      { film: uri('Q1'), person: uri('Q10'), name: lit('Agnès Varda') },
      { film: uri('Q1'), person: uri('Q11') },
    ]
    expect(parsePeople(rows).get('Q1')).toEqual([{ id: 'Q10', name: 'Agnès Varda' }])
  })
})

describe('parseCast', () => {
  it('reads billing order and fame, tolerating missing or odd values', () => {
    const rows = [
      { film: uri('Q1'), person: uri('Q10'), name: lit('A'), ord: lit('2'), links: num(40) },
      { film: uri('Q1'), person: uri('Q11'), name: lit('B'), ord: lit('first') },
    ]
    expect(parseCast(rows).get('Q1')).toEqual([
      { id: 'Q10', name: 'A', ord: 2, links: 40 },
      { id: 'Q11', name: 'B', ord: null, links: 0 },
    ])
  })
})

describe('parseVideos', () => {
  it('flags trailers, merges duplicates and drops malformed ids', () => {
    const rows = [
      { film: uri('Q1'), yt: lit('YoHD9XEInc0') },
      { film: uri('Q1'), yt: lit('YoHD9XEInc0'), role: uri('Q622550') },
      { film: uri('Q1'), yt: lit('8hP9D6kZseM'), role: uri('Q1') },
      { film: uri('Q1'), yt: lit('not a youtube id') },
    ]
    expect(parseVideos(rows).get('Q1')).toEqual([
      { id: 'YoHD9XEInc0', trailer: true },
      { id: '8hP9D6kZseM', trailer: false },
    ])
  })
})

describe('parseAwards', () => {
  it('returns unique award ids per film', () => {
    const rows = [
      { film: uri('Q1'), award: uri('Q102427') },
      { film: uri('Q1'), award: uri('Q102427') },
      { film: uri('Q1'), award: uri('Q103360') },
    ]
    expect(parseAwards(rows).get('Q1')).toEqual(['Q102427', 'Q103360'])
  })
})
