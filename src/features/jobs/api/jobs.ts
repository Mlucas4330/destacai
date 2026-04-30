import { fetchApi } from '@/lib/api.client'
import type { Job, JobStatus } from '@/shared/types'

export function getJobs(token: string): Promise<Job[]> {
  return fetchApi<{ jobs: Job[] }>({ method: 'GET', path: '/jobs', token }).then((r) => r.jobs)
}

export function createJob(
  token: string,
  data: { title: string; company: string; description: string },
): Promise<Job> {
  return fetchApi<Job>({ method: 'POST', path: '/jobs', body: data, token })
}

export function deleteJob(token: string, jobId: string): Promise<void> {
  return fetchApi<void>({ method: 'DELETE', path: `/jobs/${jobId}`, token })
}

export function clearJobs(token: string): Promise<void> {
  return fetchApi<void>({ method: 'DELETE', path: '/jobs', token })
}

export function updateJobStatus(
  token: string,
  jobId: string,
  status: JobStatus,
): Promise<{ id: string; status: JobStatus }> {
  return fetchApi<{ id: string; status: JobStatus }>({
    method: 'PATCH',
    path: `/jobs/${jobId}/status`,
    body: { status },
    token,
  })
}
