import { createStore, useStore } from 'zustand'
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware'
import { recordSpin, setRating, setReview, toggleFlag } from './actions'
import { mergeUserData } from './io'
import { createSafeStorage, type SafeStorage } from './safeStorage'
import { EMPTY_USER_DATA, userDataSchema, type FlagKey, type UserData } from './userSchema'

export const STORAGE_KEY = 'nightreel:user'
const STORAGE_VERSION = 1

export interface UserActions {
  toggleWatchlist(id: string): void
  toggleWatched(id: string): void
  toggleFavorite(id: string): void
  setRating(id: string, rating: number | null): void
  setReview(id: string, text: string): void
  recordSpin(id: string): void
  importData(data: UserData, mode: 'merge' | 'replace'): void
  reset(): void
}

export type UserState = UserData & UserActions

const pickData = (state: UserData): UserData => ({
  version: state.version,
  entries: state.entries,
  spinHistory: state.spinHistory,
})

function backupCorrupt(storage: SafeStorage, raw: string): void {
  storage.setItem(`${STORAGE_KEY}:corrupt-${Date.now()}`, raw)
  console.warn('[nightreel] Saved list data was unreadable. A backup was kept and the list was reset.')
}

function persistStorage(storage: SafeStorage): PersistStorage<UserData> {
  return {
    getItem: (name) => {
      const raw = storage.getItem(name)
      if (raw === null) return null
      try {
        return JSON.parse(raw) as StorageValue<UserData>
      } catch {
        backupCorrupt(storage, raw)
        return null
      }
    },
    setItem: (name, value) => storage.setItem(name, JSON.stringify(value)),
    removeItem: (name) => storage.removeItem(name),
  }
}

export function createUserStore(storage: SafeStorage) {
  return createStore<UserState>()(
    persist<UserState, [], [], UserData>(
      (set, get) => {
        const update = (change: (data: UserData) => UserData) => set(change(pickData(get())))
        const toggle = (flag: FlagKey) => (id: string) =>
          update((data) => toggleFlag(data, id, flag, Date.now()))
        return {
          ...EMPTY_USER_DATA,
          toggleWatchlist: toggle('watchlistAt'),
          toggleWatched: toggle('watchedAt'),
          toggleFavorite: toggle('favoriteAt'),
          setRating: (id, rating) => update((data) => setRating(data, id, rating, Date.now())),
          setReview: (id, text) => update((data) => setReview(data, id, text, Date.now())),
          recordSpin: (id) => update((data) => recordSpin(data, id)),
          importData: (incoming, mode) =>
            update((data) => (mode === 'merge' ? mergeUserData(data, incoming) : incoming)),
          reset: () => set({ ...EMPTY_USER_DATA }),
        }
      },
      {
        name: STORAGE_KEY,
        version: STORAGE_VERSION,
        storage: persistStorage(storage),
        partialize: pickData,
        // Only version 1 exists; anything else starts fresh rather than guessing.
        migrate: () => EMPTY_USER_DATA,
        merge: (persisted, current) => {
          const parsed = userDataSchema.safeParse(persisted)
          if (parsed.success) return { ...current, ...parsed.data }
          if (persisted !== undefined && persisted !== null) {
            backupCorrupt(storage, JSON.stringify(persisted))
          }
          return current
        },
      },
    ),
  )
}

const browserStorage = createSafeStorage(() => window.localStorage)

export const userStore = createUserStore(browserStorage)

export const isStorageAvailable = (): boolean => browserStorage.available

export function useUser<T>(selector: (state: UserState) => T): T {
  return useStore(userStore, selector)
}

/** Keeps open tabs in sync when another tab changes the list. */
export function syncAcrossTabs(): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) void userStore.persist.rehydrate()
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
