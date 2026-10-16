import { valuesBlock } from './sparql'

type Ids = readonly string[]

const ACADEMY_AWARD = 'Q19020'
const BEST_PICTURE = 'Q102427'
const ENGLISH_WIKIPEDIA = '<https://en.wikipedia.org/>'

/** Films of one Wikidata type with at least `minSitelinks` language editions. */
export function topFilmsQuery(type: string, minSitelinks: number): string {
  if (!/^Q\d+$/.test(type)) throw new Error(`Not a Wikidata id: ${type}`)
  return `SELECT ?film ?links WHERE {
  ?film wdt:P31 wd:${type}; wikibase:sitelinks ?links.
  FILTER(?links >= ${Math.floor(minSitelinks)})
}`
}

export const coreQuery = (ids: Ids) => `SELECT ?film ?label ?date ?seconds ?article WHERE {
  ${valuesBlock(ids)}
  OPTIONAL { ?film rdfs:label ?label. FILTER(LANG(?label) = "en") }
  OPTIONAL { ?film wdt:P577 ?date }
  OPTIONAL { ?film p:P2047/psn:P2047/wikibase:quantityAmount ?seconds }
  OPTIONAL { ?article schema:about ?film; schema:isPartOf ${ENGLISH_WIKIPEDIA} }
}`

export const genresQuery = (ids: Ids) => `SELECT ?film ?label WHERE {
  ${valuesBlock(ids)}
  ?film wdt:P136 ?genre.
  ?genre rdfs:label ?label. FILTER(LANG(?label) = "en")
}`

export const directorsQuery = (ids: Ids) => `SELECT ?film ?person ?name WHERE {
  ${valuesBlock(ids)}
  ?film wdt:P57 ?person.
  ?person rdfs:label ?name. FILTER(LANG(?name) = "en")
}`

export const castQuery = (ids: Ids) => `SELECT ?film ?person ?name ?ord ?links WHERE {
  ${valuesBlock(ids)}
  ?film p:P161 ?statement.
  ?statement ps:P161 ?person.
  ?person rdfs:label ?name. FILTER(LANG(?name) = "en")
  OPTIONAL { ?statement pq:P1545 ?ord }
  OPTIONAL { ?person wikibase:sitelinks ?links }
}`

export const videosQuery = (ids: Ids) => `SELECT ?film ?yt ?role WHERE {
  ${valuesBlock(ids)}
  ?film p:P1651 ?statement.
  ?statement ps:P1651 ?yt.
  OPTIONAL { ?statement pq:P3831 ?role }
}`

export const awardsQuery = (ids: Ids) => `SELECT DISTINCT ?film ?award WHERE {
  ${valuesBlock(ids)}
  { ?film wdt:P166 ?award. ?award wdt:P31 wd:${ACADEMY_AWARD}. }
  UNION
  { ?film wdt:P166 wd:${BEST_PICTURE}. BIND(wd:${BEST_PICTURE} AS ?award) }
}`

export const countriesQuery = (ids: Ids) => `SELECT ?film ?name WHERE {
  ${valuesBlock(ids)}
  ?film wdt:P495 ?country.
  ?country rdfs:label ?name. FILTER(LANG(?name) = "en")
}`
