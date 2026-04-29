import { useState, useEffect, useCallback } from 'react'
import { useCreateJob } from './useJobs'
import { useAuthContext } from '@features/auth/context/AuthContext'
import { createApiClient } from '@lib/api'
import type { Job } from '@shared/types'
import { STORAGE_KEYS } from '@shared/constants'

interface PendingStorage {
  pendingDescription?: string
  pendingTitle?: string
  pendingCompany?: string
}

const useAddJob = (onSave: (job: Job) => void) => {
  const [description, setDescription] = useState('')
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)

  const createJob = useCreateJob()
  const { getToken } = useAuthContext()

  useEffect(() => {
    const api = createApiClient(getToken)
    chrome.storage.local.get(
      [STORAGE_KEYS.PENDING_DESCRIPTION, STORAGE_KEYS.PENDING_TITLE, STORAGE_KEYS.PENDING_COMPANY],
      async (result: PendingStorage) => {
        const desc = result.pendingDescription ?? ''
        const pendingTitle = result.pendingTitle ?? ''
        const pendingCompany = result.pendingCompany ?? ''

        if (desc) setDescription(desc)
        if (pendingTitle) setTitle(pendingTitle)
        if (pendingCompany) setCompany(pendingCompany)

        if (desc && (!pendingTitle || !pendingCompany)) {
          setIsExtracting(true)
          try {
            const extracted = await api.post<{ title: string; company: string }>('/jobs/extract', { description: desc })
            if (!pendingTitle && extracted.title) setTitle(extracted.title)
            if (!pendingCompany && extracted.company) setCompany(extracted.company)
          } catch {
            // extraction failure is non-fatal — user can fill in manually
          } finally {
            setIsExtracting(false)
          }
        }
      },
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const persistField = useCallback((field: string, value: string) => {
    chrome.storage.local.set({ [field]: value })
  }, [])

  const updateTitle = useCallback((value: string) => {
    setTitle(value)
    persistField(STORAGE_KEYS.PENDING_TITLE, value)
  }, [persistField])

  const updateCompany = useCallback((value: string) => {
    setCompany(value)
    persistField(STORAGE_KEYS.PENDING_COMPANY, value)
  }, [persistField])

  const updateDescription = useCallback((value: string) => {
    setDescription(value)
    persistField(STORAGE_KEYS.PENDING_DESCRIPTION, value)
  }, [persistField])

  const extractFromDescription = useCallback(async () => {
    if (!description.trim() || isExtracting) return
    setIsExtracting(true)
    try {
      const api = createApiClient(getToken)
      const extracted = await api.post<{ title: string; company: string }>('/jobs/extract', { description: description.trim() })
      if (extracted.title) { setTitle(extracted.title); persistField(STORAGE_KEYS.PENDING_TITLE, extracted.title) }
      if (extracted.company) { setCompany(extracted.company); persistField(STORAGE_KEYS.PENDING_COMPANY, extracted.company) }
    } catch {
      // extraction failure is non-fatal
    } finally {
      setIsExtracting(false)
    }
  }, [description, isExtracting, getToken, persistField])

  const saveJob = useCallback(() => {
    createJob.mutate(
      { title: title.trim(), company: company.trim(), description: description.trim() },
      {
        onSuccess: (job) => {
          chrome.storage.local.remove([STORAGE_KEYS.PENDING_DESCRIPTION, STORAGE_KEYS.PENDING_TITLE, STORAGE_KEYS.PENDING_COMPANY])
          onSave(job as Job)
        },
      },
    )
  }, [title, company, description, createJob, onSave])

  const isValid = title.trim().length > 0 && company.trim().length > 0 && description.trim().length > 0
  const isPending = createJob.isPending

  return { title, company, description, updateTitle, updateCompany, updateDescription, saveJob, extractFromDescription, isValid, isPending, isExtracting }
}

export default useAddJob
