import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@shared/constants'
import { useAuthContext } from '@features/auth/context/AuthContext'
import toast from 'react-hot-toast'
import { createApiClient } from '@lib/api'
import type { UserProfile } from '@shared/types'

function useApi() {
  const { getToken } = useAuthContext()
  return createApiClient(getToken)
}

export function useUser() {
  const api = useApi()
  return useQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: () => api.get<UserProfile>('/users/me'),
  })
}

export function useUploadCV() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.uploadFile<{ cvFileName: string; cvR2Key: string }>('/cv/upload', formData)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.USER] }),
  })
}

export function useDeleteCV() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/cv'),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.USER] }),
    onError: (err) => toast.error(err.message ?? 'Failed to remove CV. Please try again.'),
  })
}
