import type { Genre, Movie } from '../data/schema'

export interface Mood {
  id: string
  label: string
  blurb: string
  genres: readonly Genre[]
  maxYear?: number
}

const ANY_MOOD: Mood = { id: 'any', label: 'Surprise me', blurb: 'Anything on the reel', genres: [] }

export const MOODS: readonly Mood[] = [
  ANY_MOOD,
  {
    id: 'cozy',
    label: 'Cozy',
    blurb: 'Warm, light and easy',
    genres: ['Comedy', 'Romance', 'Animation', 'Family'],
  },
  {
    id: 'edge',
    label: 'Edge of seat',
    blurb: 'Tension and adrenaline',
    genres: ['Thriller', 'Action', 'Crime'],
  },
  { id: 'mind', label: 'Mind-bending', blurb: 'Twists and big ideas', genres: ['Sci-Fi', 'Mystery', 'Fantasy'] },
  { id: 'laugh', label: 'Laugh out loud', blurb: 'Comedy, pure and simple', genres: ['Comedy'] },
  { id: 'cry', label: 'A good cry', blurb: 'Bring tissues', genres: ['Romance', 'Biography', 'War'] },
  {
    id: 'epic',
    label: 'Epic night',
    blurb: 'Big worlds, long runs',
    genres: ['Adventure', 'History', 'Fantasy', 'War'],
  },
  { id: 'spooky', label: 'Spooky', blurb: 'Lights off, volume up', genres: ['Horror'] },
  { id: 'classic', label: 'Old Hollywood', blurb: 'Golden-age gems before 1970', genres: [], maxYear: 1969 },
]

export const findMood = (id: string): Mood => MOODS.find((mood) => mood.id === id) ?? ANY_MOOD

export function matchesMood(movie: Movie, mood: Mood): boolean {
  const genreOk = mood.genres.length === 0 || movie.genres.some((genre) => mood.genres.includes(genre))
  const yearOk = mood.maxYear === undefined || movie.year <= mood.maxYear
  return genreOk && yearOk
}
