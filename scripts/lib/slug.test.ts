// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { assignSlugs, slugify } from './slug'

describe('slugify', () => {
  it.each([
    ['Inception', 'inception'],
    ['Amélie', 'amelie'],
    ['Star Wars: Episode IV – A New Hope', 'star-wars-episode-iv-a-new-hope'],
    ['WALL·E', 'wall-e'],
    ["Schindler's List", 'schindlers-list'],
    ['  --Hello__World--  ', 'hello-world'],
  ])('%s -> %s', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it('returns an empty string when nothing is left', () => {
    expect(slugify('東京物語')).toBe('')
  })
})

describe('assignSlugs', () => {
  it('builds title-year slugs', () => {
    const slugs = assignSlugs([{ id: 'Q1', title: 'Inception', year: 2010 }])
    expect(slugs.get('Q1')).toBe('inception-2010')
  })

  it('falls back to "film" when the title has no latin characters', () => {
    expect(assignSlugs([{ id: 'Q9', title: '東京物語', year: 1953 }]).get('Q9')).toBe('film-1953')
  })

  it('keeps the first slug and suffixes later collisions with the id', () => {
    const slugs = assignSlugs([
      { id: 'Q1', title: 'Hamlet', year: 1948 },
      { id: 'Q2', title: 'Hamlet', year: 1948 },
    ])
    expect(slugs.get('Q1')).toBe('hamlet-1948')
    expect(slugs.get('Q2')).toBe('hamlet-1948-q2')
  })
})
