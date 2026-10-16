// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { movieDetailSchema, movieSchema } from '../../src/data/schema'
import { titleColor } from '../../src/domain/poster-art'
import {
  type FilmBundle,
  orderCast,
  pickReleaseDate,
  pickRuntime,
  pickTrailer,
  rejectReason,
  summarizeAwards,
  toDetail,
  toMovie,
} from './normalize'

function bundle(overrides: Partial<FilmBundle> = {}): FilmBundle {
  return {
    top: { id: 'Q25188', sitelinks: 120 },
    core: {
      label: 'Inception',
      dates: ['2010-07-16T00:00:00Z', '2010-07-08T00:00:00Z'],
      seconds: [8880],
      article: 'https://en.wikipedia.org/wiki/Inception',
    },
    genres: ['science fiction film', 'heist film'],
    directors: [{ id: 'Q25191', name: 'Christopher Nolan' }],
    cast: [
      { id: 'Q38111', name: 'Leonardo DiCaprio', ord: null, links: 120 },
      { id: 'Q193048', name: 'Joseph Gordon-Levitt', ord: null, links: 70 },
    ],
    videos: [{ id: 'YoHD9XEInc0', trailer: true }],
    awards: ['Q131520'],
    countries: ['United States', 'United Kingdom'],
    summary: {
      title: 'Inception',
      extract: 'Inception is a 2010 science fiction heist film.',
    },
    aliveVideos: new Set(['YoHD9XEInc0']),
    ...overrides,
  }
}

describe('pickRuntime', () => {
  it('converts seconds to minutes', () => {
    expect(pickRuntime([8880])).toBe(148)
  })

  it('drops implausible values and takes the lower median', () => {
    expect(pickRuntime([20 * 60, 7200, 9000, 99_999])).toBe(120)
  })

  it('returns null when nothing usable is left', () => {
    expect(pickRuntime([])).toBeNull()
    expect(pickRuntime([60])).toBeNull()
  })
})

describe('pickReleaseDate', () => {
  it('returns the earliest valid date as YYYY-MM-DD', () => {
    expect(pickReleaseDate(['2010-07-16T00:00:00Z', 'garbage', '2010-07-08T00:00:00Z'])).toBe(
      '2010-07-08',
    )
  })

  it('returns null when there are no valid dates', () => {
    expect(pickReleaseDate([])).toBeNull()
    expect(pickReleaseDate(['not-a-date'])).toBeNull()
  })
})

describe('orderCast', () => {
  it('puts billed actors first, then by fame, de-duplicated and limited', () => {
    const cast = [
      { id: 'A', name: 'A', ord: null, links: 10 },
      { id: 'B', name: 'B', ord: 2, links: 1 },
      { id: 'C', name: 'C', ord: 1, links: 5 },
      { id: 'D', name: 'D', ord: null, links: 50 },
      { id: 'A', name: 'A', ord: null, links: 10 },
    ]
    expect(orderCast(cast, 10).map((p) => p.id)).toEqual(['C', 'B', 'D', 'A'])
    expect(orderCast(cast, 2).map((p) => p.id)).toEqual(['C', 'B'])
  })
})

describe('pickTrailer', () => {
  const videos = [
    { id: 'aaaaaaaaaaa', trailer: false },
    { id: 'bbbbbbbbbbb', trailer: true },
  ]

  it('prefers a live trailer', () => {
    expect(pickTrailer(videos, new Set(['aaaaaaaaaaa', 'bbbbbbbbbbb']))).toEqual({
      youtubeId: 'bbbbbbbbbbb',
      kind: 'trailer',
    })
  })

  it('falls back to another live video', () => {
    expect(pickTrailer(videos, new Set(['aaaaaaaaaaa']))).toEqual({
      youtubeId: 'aaaaaaaaaaa',
      kind: 'video',
    })
  })

  it('returns null when no video is alive', () => {
    expect(pickTrailer(videos, new Set())).toBeNull()
  })
})

describe('summarizeAwards', () => {
  it('counts distinct Oscars and flags Best Picture', () => {
    expect(summarizeAwards(['Q102427', 'Q103360', 'Q103360'])).toEqual({
      oscars: 2,
      bestPicture: true,
    })
    expect(summarizeAwards([])).toEqual({ oscars: 0, bestPicture: false })
  })
})

describe('rejectReason', () => {
  it('accepts a complete film', () => {
    expect(rejectReason(bundle())).toBeNull()
  })

  it.each<[string, Partial<FilmBundle>]>([
    ['no-title', { core: { ...bundle().core, label: null } }],
    ['no-article', { core: { ...bundle().core, article: null } }],
    ['no-year', { core: { ...bundle().core, dates: [] } }],
    ['no-runtime', { core: { ...bundle().core, seconds: [] } }],
    ['no-summary', { summary: null }],
    ['no-genres', { genres: ['film based on a novel'] }],
  ])('rejects with %s', (reason, overrides) => {
    expect(rejectReason(bundle(overrides))).toBe(reason)
  })
})

describe('toMovie / toDetail', () => {
  it('builds a schema-valid catalog movie', () => {
    const movie = toMovie(bundle(), 'inception-2010')
    expect(movieSchema.parse(movie)).toEqual(movie)
    expect(movie).toMatchObject({
      id: 'Q25188',
      slug: 'inception-2010',
      title: 'Inception',
      year: 2010,
      runtime: 148,
      genres: ['Crime', 'Sci-Fi'],
      color: titleColor('Inception'),
      directors: ['Q25191'],
      cast: ['Q38111', 'Q193048'],
      oscars: 1,
      bestPicture: false,
      hasTrailer: true,
      popularity: 120,
    })
    expect(movie).not.toHaveProperty('rating')
  })

  it('throws when asked to build a rejected film', () => {
    expect(() => toMovie(bundle({ summary: null }), 'x-2010')).toThrow(/no-summary/)
  })

  it('builds schema-valid details', () => {
    const detail = toDetail(bundle(), ['Q1'])
    expect(movieDetailSchema.parse(detail)).toEqual(detail)
    expect(detail).toMatchObject({
      id: 'Q25188',
      overview: 'Inception is a 2010 science fiction heist film.',
      releaseDate: '2010-07-08',
      countries: ['United States', 'United Kingdom'],
      trailer: { youtubeId: 'YoHD9XEInc0', kind: 'trailer' },
      wikipedia: 'https://en.wikipedia.org/wiki/Inception',
      similar: ['Q1'],
    })
  })
})
