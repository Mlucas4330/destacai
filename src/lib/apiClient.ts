import axios, { type AxiosError } from 'axios'

// Same-origin `/api/*`, served by Next.js route handlers. The Auth.js session
// cookie is sent automatically with same-origin requests.
const BASE_URL = '/api'
const API_TIMEOUT = 5_000

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const message = error.response?.data?.error ?? error.message
    return Promise.reject(new Error(message))
  },
)
