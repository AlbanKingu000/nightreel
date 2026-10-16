export interface SafeStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  keys(prefix?: string): string[]
  /** False once storage is unreachable (private mode, blocked, full); data then lives in memory. */
  readonly available: boolean
}

function tryOpen(open: () => Storage): Storage | null {
  try {
    const storage = open()
    storage.getItem('nightreel:probe')
    return storage
  } catch {
    return null
  }
}

function backendKeys(storage: Storage | null): string[] {
  if (!storage) return []
  try {
    return Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter(
      (key): key is string => key !== null,
    )
  } catch {
    return []
  }
}

/** localStorage wrapper that never throws and degrades to an in-memory store. */
export function createSafeStorage(open: () => Storage): SafeStorage {
  const memory = new Map<string, string>()
  const backend = tryOpen(open)
  let available = backend !== null

  return {
    get available() {
      return available
    },
    getItem(key) {
      if (memory.has(key)) return memory.get(key) ?? null
      try {
        return backend?.getItem(key) ?? null
      } catch {
        return null
      }
    },
    setItem(key, value) {
      if (backend && available) {
        try {
          backend.setItem(key, value)
          return
        } catch {
          available = false
        }
      }
      memory.set(key, value)
    },
    removeItem(key) {
      memory.delete(key)
      try {
        backend?.removeItem(key)
      } catch {
        // Storage became unreachable; the in-memory copy is already gone.
      }
    },
    keys(prefix = '') {
      const all = new Set([...memory.keys(), ...backendKeys(backend)])
      return [...all].filter((key) => key.startsWith(prefix)).sort()
    },
  }
}
