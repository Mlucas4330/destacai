import { createApiClient, BASE_URL } from '@/lib/api.client'
import type { ProcessingStatus } from '@/shared/types'

export interface AtsSideResult {
  status: ProcessingStatus
  score: number | null
  explanation: string | null
}

export interface AtsResult {
  uploaded: AtsSideResult
  generated: AtsSideResult
}

export async function getAtsScore(
  getToken: () => Promise<string | null>,
  jobId: string,
): Promise<AtsResult> {
  const api = createApiClient(getToken)
  return api.get<AtsResult>(`/ats/${jobId}`)
}

export async function getGuestAtsScore(jobId: string, guestId: string): Promise<AtsResult> {
  const res = await fetch(`${BASE_URL}/guest/ats/${jobId}?guestId=${encodeURIComponent(guestId)}`)
  if (!res.ok) throw new Error('Failed to fetch ATS score')
  return res.json()
}
