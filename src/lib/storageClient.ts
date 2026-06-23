// Web storage client backed by localStorage. Keeps an async get/set/remove
// interface (same shape the app used for chrome.storage.local) and transparently
// JSON-serializes values so both strings and objects round-trip correctly.
export const storageClient = {
  get: async <T>(key: string): Promise<T | undefined> => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? undefined : (JSON.parse(raw) as T)
    } catch {
      return undefined
    }
  },

  set: async (key: string, value: unknown): Promise<void> => {
    localStorage.setItem(key, JSON.stringify(value))
  },

  remove: async (key: string | string[]): Promise<void> => {
    const keys = Array.isArray(key) ? key : [key]
    keys.forEach((k) => localStorage.removeItem(k))
  },
}
