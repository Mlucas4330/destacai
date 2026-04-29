export const BASE_URL = import.meta.env.VITE_API_URL as string

type GetToken = () => Promise<string | null>

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function createApiClient(getToken: GetToken) {
  async function headers(extra?: HeadersInit): Promise<HeadersInit> {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}`, ...extra } : { ...extra }
  }

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: await headers(body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      const message = body?.message ?? body?.error ?? res.statusText
      throw new ApiError(res.status, message)
    }
    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
    delete: (path: string) => request<void>('DELETE', path),
    uploadFile: async <T>(path: string, formData: FormData): Promise<T> => {
      const token = await getToken()
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}` },
        body: formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message = body?.message ?? body?.error ?? res.statusText
        throw new ApiError(res.status, message)
      }
      return res.json() as Promise<T>
    },
  }
}

export { ApiError }
