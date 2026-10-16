import { z } from 'zod'
import { compactEntry } from './actions'
import { SPIN_HISTORY_LIMIT, userDataSchema, type UserData, type UserEntry } from './userSchema'

export const EXPORT_FORMAT = 'nightreel-user-data'

const exportSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  exportedAt: z.string(),
  data: userDataSchema,
})

export type ImportResult = { ok: true; data: UserData } | { ok: false; error: string }

export function serializeUserData(data: UserData, now: Date = new Date()): string {
  return JSON.stringify({ format: EXPORT_FORMAT, exportedAt: now.toISOString(), data }, null, 2)
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) as unknown }
  } catch {
    return { ok: false }
  }
}

export function parseUserDataFile(text: string): ImportResult {
  const json = parseJson(text)
  if (!json.ok) return { ok: false, error: "That file isn't valid JSON." }
  const parsed = exportSchema.safeParse(json.value)
  if (parsed.success) return { ok: true, data: parsed.data.data }
  const issue = parsed.error.issues[0]
  if (!issue || issue.path[0] === 'format') {
    return { ok: false, error: "That file isn't a Nightreel export." }
  }
  return { ok: false, error: `That file has invalid data at "${issue.path.join('.')}".` }
}

const newest = (a: number | undefined, b: number | undefined) =>
  a === undefined ? b : b === undefined ? a : Math.max(a, b)

function mergeEntry(a: UserEntry = {}, b: UserEntry = {}): UserEntry {
  const ratingSource = (b.ratedAt ?? -1) > (a.ratedAt ?? -1) ? b : a
  const reviewSource = (b.review?.updatedAt ?? -1) > (a.review?.updatedAt ?? -1) ? b : a
  return compactEntry({
    watchlistAt: newest(a.watchlistAt, b.watchlistAt),
    watchedAt: newest(a.watchedAt, b.watchedAt),
    favoriteAt: newest(a.favoriteAt, b.favoriteAt),
    rating: ratingSource.rating,
    ratedAt: ratingSource.ratedAt,
    review: reviewSource.review,
  })
}

/** Union of both lists; for each field the most recently changed value wins. */
export function mergeUserData(current: UserData, incoming: UserData): UserData {
  const ids = new Set([...Object.keys(current.entries), ...Object.keys(incoming.entries)])
  const entries = Object.fromEntries(
    [...ids].map((id) => [id, mergeEntry(current.entries[id], incoming.entries[id])]),
  )
  const spinHistory = [...new Set([...incoming.spinHistory, ...current.spinHistory])]
  return { version: 1, entries, spinHistory: spinHistory.slice(0, SPIN_HISTORY_LIMIT) }
}
