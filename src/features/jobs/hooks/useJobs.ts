import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth/stores/auth'
import { useGuestContext } from '@/features/auth/stores/GuestContext'
import toast from 'react-hot-toast'
import * as jobsApi from '@/features/jobs/api/jobs'
import { guestJobToJob } from '@/features/jobs/services/jobConverters'
import { CACHE_KEYS, POLLING_INTERVAL_MS, QUERY_KEYS } from '@/features/jobs/constants'
import type { Job, JobStatus, GuestJob } from '@/shared/types'

// ── Auth hooks ───────────────────────────────────────────────────────────────

function readJobsCache(): Job[] | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.JOBS)
    return raw ? (JSON.parse(raw) as Job[]) : undefined
  } catch {
    return undefined
  }
}

export function useAuthJobs() {
  const { getToken } = useAuthContext()

  const result = useQuery({
    queryKey: [QUERY_KEYS.JOBS],
    queryFn: async () => {
      const token = await getToken()
      return jobsApi.getJobs(token!)
    },
    staleTime: 60_000,
    initialData: readJobsCache,
    initialDataUpdatedAt: () => Number(localStorage.getItem(CACHE_KEYS.JOBS_TS) ?? 0),
    refetchInterval: (query) => {
      const jobs = query.state.data
      if (!jobs) return false
      const hasPending = jobs.some(
        (j) =>
          j.atsStatus === 'queued' ||
          j.atsStatus === 'processing' ||
          j.cvGenerationStatus === 'queued' ||
          j.cvGenerationStatus === 'processing' ||
          j.generatedCvAtsStatus === 'queued' ||
          j.generatedCvAtsStatus === 'processing',
      )
      return hasPending ? POLLING_INTERVAL_MS : false
    },
  })

  useEffect(() => {
    if (result.data) {
      localStorage.setItem(CACHE_KEYS.JOBS, JSON.stringify(result.data))
      localStorage.setItem(CACHE_KEYS.JOBS_TS, String(Date.now()))
    }
  }, [result.data])

  return result
}

export function useAuthCreateJob() {
  const { getToken } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (data: { title: string; company: string; description: string }) => {
      const token = await getToken()
      return jobsApi.createJob(token!, data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] }),
    onError: (err) => toast.error(err.message ?? 'Failed to save job. Please try again.'),
  })
}

export function useAuthDeleteJob() {
  const { getToken } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const token = await getToken()
      return jobsApi.deleteJob(token!, jobId)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] }),
    onError: (err) => toast.error(err.message ?? 'Failed to delete job. Please try again.'),
  })
}

export function useAuthClearJobs() {
  const { getToken } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const token = await getToken()
      return jobsApi.clearJobs(token!)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] }),
    onError: (err) => toast.error(err.message ?? 'Failed to clear jobs. Please try again.'),
  })
}

export function useAuthUpdateJobStatus() {
  const { getToken } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: JobStatus }) => {
      const token = await getToken()
      return jobsApi.updateJobStatus(token!, jobId, status)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] }),
    onError: (err) => toast.error(err.message ?? 'Failed to update status. Please try again.'),
  })
}

// ── Guest hooks ──────────────────────────────────────────────────────────────

export function useGuestJobs() {
  const { guestJobs } = useGuestContext()

  return {
    data: guestJobs.map(guestJobToJob),
    isLoading: false,
    isFetching: false,
  } as ReturnType<typeof useQuery<Job[]>>
}

export function useGuestCreateJob() {
  const { addGuestJob } = useGuestContext()

  return useMutation({
    mutationFn: async (data: { title: string; company: string; description: string }): Promise<Job> => {
      const guestJob: GuestJob = {
        id: crypto.randomUUID(),
        title: data.title,
        company: data.company,
        description: data.description,
        status: 'saved',
        createdAt: new Date().toISOString(),
        cvGenerationStatus: 'idle',
        cvR2Key: null,
        atsStatus: 'idle',
        atsScore: null,
        atsExplanation: null,
        generatedCvAtsStatus: 'idle',
        generatedCvAtsScore: null,
        generatedCvAtsExplanation: null,
      }
      await addGuestJob(guestJob)
      return guestJobToJob(guestJob)
    },
  })
}

export function useGuestDeleteJob() {
  const { deleteGuestJob } = useGuestContext()
  return useMutation({ mutationFn: (jobId: string) => deleteGuestJob(jobId) })
}

export function useGuestClearJobs() {
  const { clearGuestJobs } = useGuestContext()
  return useMutation({ mutationFn: () => clearGuestJobs() })
}

export function useGuestUpdateJobStatus() {
  const { updateGuestJob } = useGuestContext()
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: JobStatus }) =>
      updateGuestJob(jobId, { status }),
  })
}
