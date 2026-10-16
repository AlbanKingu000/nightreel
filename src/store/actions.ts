import {
  MAX_REVIEW_LENGTH,
  SPIN_HISTORY_LIMIT,
  type FlagKey,
  type UserData,
  type UserEntry,
} from './userSchema'

/** Drops undefined fields so stored entries stay minimal. */
export const compactEntry = (entry: UserEntry): UserEntry =>
  Object.fromEntries(Object.entries(entry).filter(([, value]) => value !== undefined)) as UserEntry

function withEntry(
  data: UserData,
  id: string,
  update: (entry: UserEntry) => UserEntry,
): UserData {
  const { [id]: current = {}, ...rest } = data.entries
  const next = compactEntry(update(current))
  const entries = Object.keys(next).length === 0 ? rest : { ...rest, [id]: next }
  return { ...data, entries }
}

/** Toggles a list flag. Marking a movie watched also "punches the ticket" (leaves the watchlist). */
export function toggleFlag(data: UserData, id: string, flag: FlagKey, now: number): UserData {
  return withEntry(data, id, (entry) => {
    if (entry[flag] !== undefined) return { ...entry, [flag]: undefined }
    const added = { ...entry, [flag]: now }
    return flag === 'watchedAt' ? { ...added, watchlistAt: undefined } : added
  })
}

const toHalfStars = (rating: number) => Math.min(5, Math.max(0.5, Math.round(rating * 2) / 2))

export function setRating(data: UserData, id: string, rating: number | null, now: number): UserData {
  return withEntry(data, id, (entry) =>
    rating === null
      ? { ...entry, rating: undefined, ratedAt: undefined }
      : { ...entry, rating: toHalfStars(rating), ratedAt: now },
  )
}

export function setReview(data: UserData, id: string, text: string, now: number): UserData {
  const trimmed = text.trim().slice(0, MAX_REVIEW_LENGTH)
  return withEntry(data, id, (entry) => ({
    ...entry,
    review: trimmed ? { text: trimmed, updatedAt: now } : undefined,
  }))
}

export function recordSpin(data: UserData, id: string): UserData {
  const spinHistory = [id, ...data.spinHistory.filter((existing) => existing !== id)]
  return { ...data, spinHistory: spinHistory.slice(0, SPIN_HISTORY_LIMIT) }
}
