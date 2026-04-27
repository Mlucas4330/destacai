import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@features/auth/context/AuthContext'
import { createApiClient } from '@lib/api'
import type { ProcessingStatus } from '@shared/types'
import { POLLING_INTERVAL_MS, QUERY_KEYS } from '@shared/constants'

export interface AtsSideResult {
  status: ProcessingStatus
  score: number | null
  explanation: string | null
}

export interface AtsResult {
  uploaded: AtsSideResult
  generated: AtsSideResult
}

function useApi() {
  const { getToken } = useAuthContext()
  return createApiClient(getToken)
}

export function useAtsScore(jobId: string, enabled: boolean) {
  const api = useApi()
  return useQuery({
    queryKey: [QUERY_KEYS.ATS_SCORE, jobId],
    queryFn: () => api.get<AtsResult>(`/ats/${jobId}`),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return POLLING_INTERVAL_MS
      const generatedDone = data.generated.status === 'done' || data.generated.status === 'failed'
      const uploadedDone = data.uploaded.status === 'done' || data.uploaded.status === 'failed'
      return generatedDone && uploadedDone ? false : POLLING_INTERVAL_MS
    },
  })
}
