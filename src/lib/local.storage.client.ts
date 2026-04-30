export const localStorageClient = {
  get: <T>(key: string): T | undefined => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : undefined
    } catch {
      return undefined
    }
  },

  set: (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value))
  },

  remove: (key: string | string[]) => {
    const keys = Array.isArray(key) ? key : [key]
    keys.forEach((k) => localStorage.removeItem(k))
  }
}
