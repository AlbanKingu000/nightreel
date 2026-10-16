/** Lowercases and strips combining accents so "Amélie" matches "amelie". */
export const foldDiacritics = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function slugify(text: string): string {
  return foldDiacritics(text)
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
