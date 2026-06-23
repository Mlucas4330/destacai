import { apiClient } from '@/lib/apiClient'
import type { UserProfile } from '@/shared/types'

export interface UploadCVResponse {
  cvFileName: string
  cvR2Key: string
}

export const getUserProfile = () =>
  apiClient.get<UserProfile>('/users/me').then((r) => r.data)

export const uploadCV = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.post<UploadCVResponse>('/cv/upload', formData).then((r) => r.data)
}

export const deleteCV = () =>
  apiClient.delete('/cv')
