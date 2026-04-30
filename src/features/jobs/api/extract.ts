import { createApiClient } from '@/lib/api.client'

export interface ExtractedJobDetails {
  title: string
  company: string
}

export async function extractJobDetails(
  getToken: () => Promise<string | null>,
  description: string,
): Promise<ExtractedJobDetails> {
  const api = createApiClient(getToken)
  return api.post<ExtractedJobDetails>('/guest/extract', { description })
}
