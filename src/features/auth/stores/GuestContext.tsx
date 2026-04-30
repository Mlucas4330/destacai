import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { STORAGE_KEYS } from '@/shared/constants'
import type { GuestJob } from '@/shared/types'
import type { GuestContextValue } from '../types'
import { useNavigate } from 'react-router-dom'

const GuestContext = createContext<GuestContextValue | null>(null)

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [guestId, setGuestId] = useState('')
  const [guestJobs, setGuestJobs] = useState<GuestJob[]>([])
  const [guestGenerationsUsed, setGuestGenerationsUsed] = useState(0)
  const [guestCvR2Key, setGuestCvR2KeyState] = useState<string | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      let id = ls<string>(STORAGE_KEYS.GUEST_ID)
      if (!id) {
        id = crypto.randomUUID()
        await chrome.storage.local.set({ [STORAGE_KEYS.GUEST_ID]: id })
        localStorage.setItem(STORAGE_KEYS.GUEST_ID, JSON.stringify(id))
      }
      setGuestId(id)
      setGuestJobs(ls<GuestJob[]>(STORAGE_KEYS.GUEST_JOBS) ?? [])
      setGuestGenerationsUsed(ls<number>(STORAGE_KEYS.GUEST_GENERATIONS_USED) ?? 0)
      setGuestCvR2KeyState(ls<string>(STORAGE_KEYS.GUEST_CV_R2_KEY) ?? null)
    })()
  }, [])

  const addGuestJob = useCallback(async (job: GuestJob) => {
    setGuestJobs((prev) => {
      const next = [job, ...prev]
      lsSet(STORAGE_KEYS.GUEST_JOBS, next)
      return next
    })
  }, [])

  const deleteGuestJob = useCallback(async (id: string) => {
    setGuestJobs((prev) => {
      const next = prev.filter((j) => j.id !== id)
      lsSet(STORAGE_KEYS.GUEST_JOBS, next)
      return next
    })
  }, [])

  const clearGuestJobs = useCallback(async () => {
    setGuestJobs([])
    lsRemove(STORAGE_KEYS.GUEST_JOBS)
  }, [])

  const updateGuestJob = useCallback(async (id: string, patch: Partial<GuestJob>) => {
    setGuestJobs((prev) => {
      const next = prev.map((j) => (j.id === id ? { ...j, ...patch } : j))
      lsSet(STORAGE_KEYS.GUEST_JOBS, next)
      return next
    })
  }, [])

  const incrementGuestGenerations = useCallback(async () => {
    setGuestGenerationsUsed((prev) => {
      const next = prev + 1
      lsSet(STORAGE_KEYS.GUEST_GENERATIONS_USED, next)
      return next
    })
  }, [])

  const setGuestCvR2Key = useCallback(async (key: string | null) => {
    setGuestCvR2KeyState(key)
    if (key === null) {
      lsRemove(STORAGE_KEYS.GUEST_CV_R2_KEY)
    } else {
      lsSet(STORAGE_KEYS.GUEST_CV_R2_KEY, key)
    }
  }, [])

  const triggerLimitModal = useCallback(() => setShowLimitModal(true), [])
  const dismissLimitModal = useCallback(() => setShowLimitModal(false), [])

  const clearGuestData = useCallback(async () => {
    lsRemove([
      STORAGE_KEYS.GUEST_JOBS,
      STORAGE_KEYS.GUEST_GENERATIONS_USED,
      STORAGE_KEYS.GUEST_CV_R2_KEY,
    ])
    setGuestJobs([])
    setGuestGenerationsUsed(0)
    setGuestCvR2KeyState(null)
    setShowLimitModal(false)
  }, [])

  const handleSignUp = () => {
    dismissLimitModal()
    navigate('/sign-up')
  }

  const handleSignIn = () => {
    dismissLimitModal()
    navigate('/sign-in')
  }

  return (
    <GuestContext.Provider
      value={{
        guestId,
        guestJobs,
        guestGenerationsUsed,
        guestCvR2Key,
        showLimitModal,
        addGuestJob,
        deleteGuestJob,
        clearGuestJobs,
        updateGuestJob,
        incrementGuestGenerations,
        setGuestCvR2Key,
        triggerLimitModal,
        dismissLimitModal,
        clearGuestData,
        handleSignIn,
        handleSignUp
      }}
    >
      {children}
    </GuestContext.Provider>
  )
}

export function useGuestContext() {
  const ctx = useContext(GuestContext)
  if (!ctx) throw new Error('useGuestContext must be used inside GuestProvider')
  return ctx
}
