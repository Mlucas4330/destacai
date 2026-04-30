import { fetchApi } from '@/lib/api.client'
import type { UserProfile } from '@/shared/types'

export interface UploadCVResponse {
  cvFileName: string
  cvR2Key: string
}

export function getUserProfile(token: string): Promise<UserProfile> {
  return fetchApi<UserProfile>({ method: 'GET', path: '/users/me', token })
}

export function uploadCV(token: string, file: File): Promise<UploadCVResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return fetchApi<UploadCVResponse>({ method: 'POST', path: '/cv/upload', body: formData, token })
}

export function uploadCVGuest(guestId: string, file: File): Promise<UploadCVResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('guestId', guestId)
  return fetchApi<UploadCVResponse>({ method: 'POST', path: '/guest/cv/upload', body: formData })
}

export function deleteCV(token: string): Promise<void> {
  return fetchApi<void>({ method: 'DELETE', path: '/cv', token })
}

export function deleteCVGuest(guestId: string, cvR2Key: string): Promise<void> {
  return fetchApi<void>({ method: 'DELETE', path: '/guest/cv', body: { guestId, cvR2Key } })
}
