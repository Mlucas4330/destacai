import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth/stores/auth'
import { useGuestContext } from '@/features/auth/stores/GuestContext'
import * as atsApi from '@/features/jobs/api/ats'
import type { ProcessingStatus } from '@/shared/types'
import { POLLING_INTERVAL_MS, QUERY_KEYS } from '@/features/jobs/constants'

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

function isDone(data: AtsResult | undefined): boolean {
  if (!data) return false
  const generatedDone = data.generated.status === 'done' || data.generated.status === 'failed'
  const uploadedDone = data.uploaded.status === 'done' || data.uploaded.status === 'failed'
  return generatedDone && uploadedDone
}

export function useAtsScore(jobId: string, enabled: boolean) {
  const { isSignedIn, isLoaded } = useAuthContext()
  const { guestId } = useGuestContext()
  const api = useApi()

  const guestQuery = useQuery({
    queryKey: [QUERY_KEYS.ATS_SCORE, jobId, guestId],
    queryFn: async (): Promise<AtsResult> => {
      const res = await fetch(`${BASE_URL}/guest/ats/${jobId}?guestId=${encodeURIComponent(guestId)}`)
      if (!res.ok) throw new Error('Failed to fetch ATS score')
      return res.json() as Promise<AtsResult>
    },
    enabled: isLoaded && !isSignedIn && enabled && !!guestId,
    refetchInterval: (query) => {
      return isDone(query.state.data) ? false : POLLING_INTERVAL_MS
    },
  })

  const authQuery = useQuery({
    queryKey: [QUERY_KEYS.ATS_SCORE, jobId, 'auth'],
    queryFn: () => api.get<AtsResult>(`/ats/${jobId}`),
    enabled: isLoaded && isSignedIn && enabled,
    refetchInterval: (query) => {
      return isDone(query.state.data) ? false : POLLING_INTERVAL_MS
    },
  })

  return isSignedIn ? authQuery : guestQuery
}
