import { createApiClient, BASE_URL } from '@/lib/api.client'

export interface GenerationStatus {
  status: 'idle' | 'queued' | 'processing' | 'done' | 'failed'
  downloadUrl?: string
  error?: string
}

export async function generateCV(getToken: () => Promise<string | null>, jobId: string): Promise<{ status: string }> {
  const api = createApiClient(getToken)
  return api.post<{ status: string }>(`/generate/${jobId}`)
}

export async function getGenerationStatus(
  getToken: () => Promise<string | null>,
  jobId: string,
): Promise<GenerationStatus> {
  const api = createApiClient(getToken)
  return api.get<GenerationStatus>(`/generate/${jobId}/status`)
}

export async function getGuestGenerationStatus(jobId: string, guestId: string): Promise<GenerationStatus> {
  const res = await fetch(`${BASE_URL}/guest/generate/${jobId}/status?guestId=${encodeURIComponent(guestId)}`)
  if (!res.ok) throw new Error('Failed to fetch status')
  return res.json()
}

export async function generateCVGuest(
  guestId: string,
  jobId: string,
  cvR2Key: string,
  jobDescription: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/guest/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, jobId, cvR2Key, jobDescription }),
  })
  if (res.status === 429) throw new Error('rate_limited')
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Failed to start generation')
  }
}

export async function downloadGeneratedCV(getToken: () => Promise<string | null>, jobId: string): Promise<Blob> {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/generate/${jobId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Download failed')
  return res.blob()
}

export async function downloadGeneratedCVGuest(jobId: string, guestId: string): Promise<Blob> {
  const res = await fetch(`${BASE_URL}/guest/generate/${jobId}/download?guestId=${encodeURIComponent(guestId)}`)
  if (!res.ok) throw new Error('Download failed')
  return res.blob()
}
