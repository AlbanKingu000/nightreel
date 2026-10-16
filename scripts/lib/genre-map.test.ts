// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { mapGenres } from './genre-map'

describe('mapGenres', () => {
  it('maps Wikidata genre labels onto canonical genres in canonical order', () => {
    expect(mapGenres(['science fiction film', 'action film'])).toEqual(['Action', 'Sci-Fi'])
  })

  it('splits compound genres', () => {
    expect(mapGenres(['romantic comedy'])).toEqual(['Comedy', 'Romance'])
    expect(mapGenres(['comedy-drama'])).toEqual(['Comedy', 'Drama'])
    expect(mapGenres(['crime thriller film', 'neo-noir'])).toEqual(['Crime', 'Thriller'])
  })

  it('does not treat live-action as action', () => {
    expect(mapGenres(['live-action/animated film'])).toEqual(['Animation'])
  })

  it.each([
    [['superhero film'], ['Action', 'Adventure']],
    [['spaghetti western'], ['Western']],
    [['war film', 'anti-war film'], ['War']],
    [['biographical film'], ['Biography']],
    [['musical film'], ['Music']],
    [['animated film', "children's film", 'family film'], ['Animation', 'Family']],
    [['historical film', 'period drama'], ['Drama', 'History']],
    [['documentary film'], ['Documentary']],
    [['sports film'], ['Sport']],
    [['spy film'], ['Thriller']],
    [['dystopian film'], ['Sci-Fi']],
    [['slasher film'], ['Horror']],
    [['detective film'], ['Mystery']],
    [['fantasy film'], ['Fantasy']],
  ])('maps %j to %j', (labels, expected) => {
    expect(mapGenres(labels)).toEqual(expected)
  })

  it('ignores labels without a known genre and is case-insensitive', () => {
    expect(mapGenres(['film based on literature', 'LGBT-related film'])).toEqual([])
    expect(mapGenres(['HORROR FILM'])).toEqual(['Horror'])
  })
})
