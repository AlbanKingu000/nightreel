import { z } from 'zod'

export const MAX_REVIEW_LENGTH = 1000
export const SPIN_HISTORY_LIMIT = 20

const qid = z.string().regex(/^Q\d+$/)
/** Epoch milliseconds. */
const timestamp = z.number().int().nonnegative()

export const userEntrySchema = z.object({
  watchlistAt: timestamp.optional(),
  watchedAt: timestamp.optional(),
  favoriteAt: timestamp.optional(),
  rating: z.number().min(0.5).max(5).multipleOf(0.5).optional(),
  ratedAt: timestamp.optional(),
  review: z
    .object({ text: z.string().min(1).max(MAX_REVIEW_LENGTH), updatedAt: timestamp })
    .optional(),
})

export const userDataSchema = z.object({
  version: z.literal(1),
  entries: z.record(qid, userEntrySchema),
  spinHistory: z.array(qid).max(SPIN_HISTORY_LIMIT),
})

export type UserEntry = z.infer<typeof userEntrySchema>
export type UserData = z.infer<typeof userDataSchema>
export type FlagKey = 'watchlistAt' | 'watchedAt' | 'favoriteAt'

export const EMPTY_USER_DATA: UserData = { version: 1, entries: {}, spinHistory: [] }
