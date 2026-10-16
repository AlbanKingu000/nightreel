import { slugify } from '../../src/domain/text'

export { slugify }

export interface SlugInput {
  id: string
  title: string
  year: number
}

/** Assigns `title-year` slugs; later collisions get the Wikidata id appended. */
export function assignSlugs(items: readonly SlugInput[]): Map<string, string> {
  const taken = new Set<string>()
  const slugs = new Map<string, string>()
  for (const item of items) {
    const base = `${slugify(item.title) || 'film'}-${item.year}`
    const slug = taken.has(base) ? `${base}-${item.id.toLowerCase()}` : base
    taken.add(slug)
    slugs.set(item.id, slug)
  }
  return slugs
}
