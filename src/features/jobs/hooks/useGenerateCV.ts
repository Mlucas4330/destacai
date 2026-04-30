import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth/stores/auth'
import { useGuestContext } from '@/features/auth/stores/GuestContext'
import * as generationApi from '@/features/jobs/api/generation'
import { POLLING_INTERVAL_MS, QUERY_KEYS } from '@/features/jobs/constants'
import { FREE_TIER_LIMIT, ADMIN_BYPASS } from '@/features/config/constants'
import toast from 'react-hot-toast'

interface GenerationStatus {
  status: 'idle' | 'queued' | 'processing' | 'done' | 'failed'
  downloadUrl?: string
  error?: string
}

type MutateOptions = {
  onSuccess?: (data: unknown) => void
  onError?: (err: Error) => void
}

function useApi() {
  const { getToken } = useAuthContext()
  return { getToken }
}

export function useGenerateCV() {
  const { isSignedIn } = useAuthContext()
  const { guestId, guestJobs, guestGenerationsUsed, guestCvR2Key, incrementGuestGenerations, triggerLimitModal, updateGuestJob } =
    useGuestContext()
  const { getToken } = useApi()
  const qc = useQueryClient()

  const apiMutation = useMutation({
    mutationFn: (jobId: string) => generationApi.generateCV(getToken, jobId),
    onSuccess: (_, jobId) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.GENERATION_STATUS, jobId] })
    },
  })

  if (!isSignedIn) {
    return {
      ...apiMutation,
      mutate: (jobId: string, opts?: MutateOptions) => {
        if (!ADMIN_BYPASS && guestGenerationsUsed >= FREE_TIER_LIMIT) {
          triggerLimitModal()
          opts?.onError?.(new Error('limit_reached'))
          return
        }
        if (!guestCvR2Key) {
          toast.error('Upload your CV first in Settings.')
          opts?.onError?.(new Error('no_cv'))
          return
        }

        const guestJob = guestJobs.find((j) => j.id === jobId)
        if (!guestJob) {
          opts?.onError?.(new Error('Job not found.'))
          return
        }

        updateGuestJob(jobId, { cvGenerationStatus: 'queued' })

        generationApi.generateCVGuest(guestId, jobId, guestCvR2Key, guestJob.description)
          .then(async () => {
            await incrementGuestGenerations()
            qc.invalidateQueries({ queryKey: [QUERY_KEYS.GENERATION_STATUS, jobId] })
            opts?.onSuccess?.({ status: 'queued' })
          })
          .catch((err) => {
            if (err.message === 'rate_limited') {
              triggerLimitModal()
            }
            updateGuestJob(jobId, { cvGenerationStatus: 'idle' })
            opts?.onError?.(err as Error)
          })
      },
    }
  }

  return apiMutation
}

export function useGenerationStatus(jobId: string, enabled: boolean) {
  const { isSignedIn } = useAuthContext()
  const { guestId, updateGuestJob } = useGuestContext()
  const { getToken } = useApi()

  const guestQuery = useQuery({
    queryKey: [QUERY_KEYS.GENERATION_STATUS, jobId],
    queryFn: async (): Promise<GenerationStatus> => {
      return generationApi.getGuestGenerationStatus(jobId, guestId)
    },
    enabled: !isSignedIn && enabled && !!guestId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'done' || status === 'failed') return false
      return POLLING_INTERVAL_MS
    },
  })

  const authQuery = useQuery({
    queryKey: [QUERY_KEYS.GENERATION_STATUS, jobId],
    queryFn: () => generationApi.getGenerationStatus(getToken, jobId),
    enabled: isSignedIn && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'done' || status === 'failed') return false
      return POLLING_INTERVAL_MS
    },
  })

  const guestStatus = guestQuery.data?.status
  const guestDownloadUrl = guestQuery.data?.downloadUrl

  useEffect(() => {
    if (isSignedIn || !guestStatus) return
    if (guestStatus === 'done') {
      updateGuestJob(jobId, {
        cvGenerationStatus: 'done',
        cvR2Key: `generated-cvs/guest/${guestId}/${jobId}.pdf`,
        downloadUrl: guestDownloadUrl,
      })
    } else if (guestStatus === 'failed') {
      updateGuestJob(jobId, { cvGenerationStatus: 'failed' })
    }
  }, [guestStatus, guestDownloadUrl, isSignedIn, jobId, guestId, updateGuestJob])

  return isSignedIn ? authQuery : guestQuery
}
