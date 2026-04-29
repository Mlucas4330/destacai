import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@features/auth/context/AuthContext'
import { useGuestContext } from '@features/auth/context/GuestContext'
import { createApiClient } from '@lib/api'
import type { ProcessingStatus } from '@shared/types'
import { POLLING_INTERVAL_MS, QUERY_KEYS } from '@shared/constants'

const BASE_URL = import.meta.env.VITE_API_URL as string

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
  const { isSignedIn } = useAuthContext()
  const { guestId } = useGuestContext()
  const api = useApi()

  const guestQuery = useQuery({
    queryKey: [QUERY_KEYS.ATS_SCORE, jobId, guestId],
    queryFn: async (): Promise<AtsResult> => {
      const res = await fetch(`${BASE_URL}/guest/ats/${jobId}?guestId=${encodeURIComponent(guestId)}`)
      if (!res.ok) throw new Error('Failed to fetch ATS score')
      return res.json() as Promise<AtsResult>
    },
    enabled: !isSignedIn && enabled && !!guestId,
    refetchInterval: (query) => {
      return isDone(query.state.data) ? false : POLLING_INTERVAL_MS
    },
  })

  const authQuery = useQuery({
    queryKey: [QUERY_KEYS.ATS_SCORE, jobId, 'auth'],
    queryFn: () => api.get<AtsResult>(`/ats/${jobId}`),
    enabled: isSignedIn && enabled,
    refetchInterval: (query) => {
      return isDone(query.state.data) ? false : POLLING_INTERVAL_MS
    },
  })

  return isSignedIn ? authQuery : guestQuery
}
