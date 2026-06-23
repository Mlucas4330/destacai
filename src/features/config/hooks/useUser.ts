import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { getUserProfile, uploadCV, deleteCV } from '../api'
import { QUERY_KEYS, MAX_SIZE_BYTES, MAX_SIZE_MB } from '../constants'
import type { UserProfile } from '@/shared/types'

export function useUser() {
  const { status } = useSession()

  return useQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: () => getUserProfile(),
    enabled: status === 'authenticated',
    staleTime: 60_000,
  })
}

export function useHasCv() {
  const { data: user, isFetching, isError } = useUser()
  // While the profile is loading we optimistically assume a CV exists so the
  // job list (not the "upload CV" empty state) is shown first.
  return isFetching || isError || !!user?.cvFileName
}

export function useUploadCV() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => {
      if (file.type !== 'application/pdf') throw new Error('Only PDF files are supported.')
      if (file.size > MAX_SIZE_BYTES) throw new Error(`File size must be ${MAX_SIZE_MB} MB or less.`)
      return uploadCV(file)
    },
    onSuccess: (data) => {
      qc.setQueryData<UserProfile>([QUERY_KEYS.USER], (old) =>
        old ? { ...old, cvFileName: data.cvFileName, hasCv: true } : old
      )
    },
    onError: (err) => toast.error(err.message ?? 'Upload failed.'),
  })
}

export function useDeleteCV() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => deleteCV(),
    onSuccess: () => {
      qc.setQueryData<UserProfile>([QUERY_KEYS.USER], (old) =>
        old ? { ...old, cvFileName: null, hasCv: false } : old
      )
    },
    onError: (err) => toast.error(err.message ?? 'Failed to remove CV. Please try again.'),
  })
}
