import { apiClient } from '@/lib/apiClient'
import type { Job, JobStatus, CVData } from './types'

export const getJobs = () =>
  apiClient.get<{ jobs: Job[] }>('/jobs').then((r) => r.data.jobs)

export const createJob = (data: { title: string; company: string; description: string }) =>
  apiClient.post<Job>('/jobs', data, { timeout: 30_000 }).then((r) => r.data)

export const deleteJob = (jobId: string) =>
  apiClient.delete(`/jobs/${jobId}`)

export const clearJobs = () =>
  apiClient.delete('/jobs')

export const updateJobStatus = (jobId: string, status: JobStatus) =>
  apiClient.patch<{ id: string; status: JobStatus }>(`/jobs/${jobId}/status`, { status }).then((r) => r.data)

export const downloadGeneratedCV = async (jobId: string): Promise<{ blob: Blob; fileName: string }> => {
  const res = await apiClient.get<Blob>(`/jobs/${jobId}/download`, { responseType: 'blob' })
  const disposition = res.headers['content-disposition'] as string | undefined
  const match = disposition?.match(/filename="([^"]+)"/)
  const fileName = match?.[1] ?? 'cv.pdf'
  return { blob: res.data, fileName }
}

export const generateCoverLetter = async (jobId: string): Promise<string> => {
  const res = await apiClient.post<string>(`/jobs/${jobId}/cover-letter`, {}, { responseType: 'text', timeout: 60_000 })
  return res.data
}

export const getCvData = (jobId: string): Promise<CVData> =>
  apiClient.get<{ cvData: CVData }>(`/jobs/${jobId}/cv-data`).then((r) => r.data.cvData)

export const updateCvData = (jobId: string, cvData: CVData): Promise<Job> =>
  apiClient.patch<Job>(`/jobs/${jobId}/cv-data`, { cvData }).then((r) => r.data)

export const generateCV = (jobId: string, userAnswers?: Record<string, boolean>, tailored = true): Promise<Job> =>
  apiClient.post<Job>(`/jobs/${jobId}/generate`, { userAnswers, tailored }).then((r) => r.data)
