import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@features/auth/context/AuthContext'
import toast from 'react-hot-toast'
import { createApiClient } from '@lib/api'
import type { Job, JobStatus } from '@shared/types'
import { POLLING_INTERVAL_MS, QUERY_KEYS } from '@shared/constants'

function useApi() {
  const { getToken } = useAuthContext()
  return createApiClient(getToken)
}

export function useJobs() {
  const api = useApi()
  return useQuery({
    queryKey: [QUERY_KEYS.JOBS],
    queryFn: () => api.get<{ jobs: Job[] }>('/jobs').then((r) => r.jobs),
    refetchInterval: (query) => {
      const jobs = query.state.data
      if (!jobs) return false
      const hasPending = jobs.some(
        (j) => j.atsStatus === 'queued' || j.atsStatus === 'processing',
      )
      return hasPending ? POLLING_INTERVAL_MS : false
    },
  })
}

export function useCreateJob() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; company: string; description: string }) => api.post<Job>('/jobs', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] }),
    onError: (err) => toast.error(err.message ?? 'Failed to save job. Please try again.'),
  })
}

export function useDeleteJob() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => api.delete(`/jobs/${jobId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] }),
    onError: (err) => toast.error(err.message ?? 'Failed to delete job. Please try again.'),
  })
}

export function useClearJobs() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/jobs'),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] }),
    onError: (err) => toast.error(err.message ?? 'Failed to clear jobs. Please try again.'),
  })
}

export function useUpdateJobStatus() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: JobStatus }) =>
      api.patch<{ id: string; status: JobStatus }>(`/jobs/${jobId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] }),
    onError: (err) => toast.error(err.message ?? 'Failed to update status. Please try again.'),
  })
}
