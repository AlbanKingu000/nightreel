import { z } from 'zod'

export const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Sport',
  'Thriller',
  'War',
  'Western',
] as const

export const genreSchema = z.enum(GENRES)
export type Genre = z.infer<typeof genreSchema>

const qid = z.string().regex(/^Q\d+$/)

export const movieSchema = z.object({
  id: qid,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  year: z.number().int().min(1880).max(2100),
  runtime: z.number().int().min(40).max(300),
  genres: z.array(genreSchema).max(10),
  /** Generated from the title hash (see src/domain/poster-art.ts); tints the poster card and page. */
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  directors: z.array(qid),
  cast: z.array(qid).max(12),
  oscars: z.number().int().nonnegative(),
  bestPicture: z.boolean(),
  hasTrailer: z.boolean(),
  /** Wikidata sitelinks: how many Wikipedia language editions cover the film. */
  popularity: z.number().int().nonnegative(),
})
export type Movie = z.infer<typeof movieSchema>

export const catalogSchema = z.object({
  version: z.literal(1),
  generatedAt: z.iso.datetime(),
  people: z.record(qid, z.string().min(1)),
  movies: z.array(movieSchema).min(1),
})
export type Catalog = z.infer<typeof catalogSchema>

export const trailerSchema = z.object({
  youtubeId: z.string().regex(/^[\w-]{11}$/),
  kind: z.enum(['trailer', 'video']),
})
export type Trailer = z.infer<typeof trailerSchema>

export const movieDetailSchema = z.object({
  id: qid,
  overview: z.string(),
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  countries: z.array(z.string()),
  trailer: trailerSchema.nullable(),
  wikipedia: z.url(),
  similar: z.array(qid),
})
export type MovieDetail = z.infer<typeof movieDetailSchema>
