import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS, CACHE_KEYS, FREE_TIER_LIMIT } from '@/shared/constants'
import { useAuthContext } from '@/features/auth/stores/auth'
import { useGuestContext } from '@/features/auth/stores/GuestContext'
import toast from 'react-hot-toast'
import type { UserProfile } from '@/shared/types'
import { getUserProfile, uploadCV, uploadCVGuest, deleteCV, deleteCVGuest } from '../api/cv'

// ── Auth hooks ───────────────────────────────────────────────────────────────

function readUserCache(): UserProfile | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.USER)
    return raw ? (JSON.parse(raw) as UserProfile) : undefined
  } catch {
    return undefined
  }
}

export function useAuthUser() {
  const { getToken } = useAuthContext()

  const result = useQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: async () => {
      const token = await getToken()
      return getUserProfile(token!)
    },
    staleTime: 60_000,
    initialData: readUserCache,
    initialDataUpdatedAt: () => Number(localStorage.getItem(CACHE_KEYS.USER_TS) ?? 0),
  })

  useEffect(() => {
    if (result.data) {
      localStorage.setItem(CACHE_KEYS.USER, JSON.stringify(result.data))
      localStorage.setItem(CACHE_KEYS.USER_TS, String(Date.now()))
    }
  }, [result.data])

  return result
}

export function useAuthUploadCV() {
  const { getToken } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const token = await getToken()
      return uploadCV(token!, file)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.USER] }),
    onError: (err) => toast.error(err.message ?? 'Failed to upload CV. Please try again.'),
  })
}

export function useAuthDeleteCV() {
  const { getToken } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const token = await getToken()
      return deleteCV(token!)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.USER] }),
    onError: (err) => toast.error(err.message ?? 'Failed to remove CV. Please try again.'),
  })
}

// ── Guest hooks ──────────────────────────────────────────────────────────────

export function useGuestUser() {
  const { guestGenerationsUsed, guestCvR2Key } = useGuestContext()
  const guestCvFileName = guestCvR2Key ? (guestCvR2Key.split('/').pop() ?? null) : null

  return {
    data: {
      id: 'guest',
      email: '',
      tier: 'free' as const,
      generationsUsed: guestGenerationsUsed,
      generationsLimit: FREE_TIER_LIMIT,
      cvFileName: guestCvFileName,
      hasCv: guestCvR2Key !== null,
      firstName: null,
      lastName: null,
    } satisfies UserProfile,
    isLoading: false,
    isFetching: false,
  } as ReturnType<typeof useQuery<UserProfile>>
}

export function useGuestUploadCV() {
  const { guestId, setGuestCvR2Key } = useGuestContext()

  return useMutation({
    mutationFn: (file: File) => uploadCVGuest(guestId, file),
    onSuccess: async (data) => {
      await setGuestCvR2Key(data.cvR2Key)
    },
    onError: (err) => toast.error(err.message ?? 'Failed to upload CV. Please try again.'),
  })
}

export function useGuestDeleteCV() {
  const { guestId, guestCvR2Key, setGuestCvR2Key } = useGuestContext()

  return useMutation({
    mutationFn: () => {
      if (!guestCvR2Key) return Promise.resolve()
      return deleteCVGuest(guestId, guestCvR2Key)
    },
    onSuccess: async () => {
      await setGuestCvR2Key(null)
    },
    onError: (err) => toast.error(err.message ?? 'Failed to remove CV. Please try again.'),
  })
}
