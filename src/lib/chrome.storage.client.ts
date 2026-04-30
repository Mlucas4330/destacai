export const chromeStorageClient = {
  get: async (key: string | string[]) => {
    try {
      await chrome.storage.local.get(key)
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