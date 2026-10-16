import { GENRES, type Genre } from '../../src/data/schema'

/** Keyword rules mapping Wikidata's free-form genre labels onto the site's canonical genres. */
const RULES: ReadonlyArray<readonly [Genre, RegExp]> = [
  ['Action', /(?<!live-)\baction\b|superhero|martial arts|disaster film|swashbuckler/],
  ['Adventure', /adventure|swashbuckler|superhero/],
  ['Animation', /animat|\banime\b|stop-motion/],
  ['Biography', /biograph|biopic/],
  ['Comedy', /comed|parody|satir|mockumentary|slapstick/],
  ['Crime', /crime|gangster|heist|noir|mafia|caper/],
  ['Documentary', /documentar/],
  ['Drama', /drama|coming-of-age|tragedy/],
  ['Family', /family|children/],
  ['Fantasy', /fantasy|fairy tale|sword and sorcery/],
  ['History', /histor|period (?:drama|piece|film)/],
  ['Horror', /horror|slasher|zombie|splatter/],
  ['Music', /musical|\bmusic\b|dance film/],
  ['Mystery', /mystery|detective|whodunit/],
  ['Romance', /romance|romantic/],
  ['Sci-Fi', /science fiction|sci-fi|cyberpunk|space opera|dystopia/],
  ['Sport', /\bsports?\b|boxing/],
  ['Thriller', /thriller|suspense|\bspy\b|espionage/],
  ['War', /\bwar\b/],
  ['Western', /western/],
]

export function mapGenres(labels: readonly string[]): Genre[] {
  const found = new Set<Genre>()
  for (const label of labels) {
    const text = label.toLowerCase()
    for (const [genre, pattern] of RULES) {
      if (pattern.test(text)) found.add(genre)
    }
  }
  return GENRES.filter((genre) => found.has(genre))
}
