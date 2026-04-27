import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@features/auth/context/AuthContext'
import { createApiClient } from '@lib/api'
import { POLLING_INTERVAL_MS, QUERY_KEYS } from '@shared/constants'

interface GenerationStatus {
  status: 'idle' | 'queued' | 'processing' | 'done' | 'failed'
  downloadUrl?: string
  error?: string
}

function useApi() {
  const { getToken } = useAuthContext()
  return createApiClient(getToken)
}

export function useGenerateCV() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) =>
      api.post<{ status: string }>(`/generate/${jobId}`),
    onSuccess: (_, jobId) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.GENERATION_STATUS, jobId] })
    },
  })
}

export function useGenerationStatus(jobId: string, enabled: boolean) {
  const api = useApi()
  return useQuery({
    queryKey: [QUERY_KEYS.GENERATION_STATUS, jobId],
    queryFn: () => api.get<GenerationStatus>(`/generate/${jobId}/status`),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'done' || status === 'failed') return false
      return POLLING_INTERVAL_MS
    },
  })
}
