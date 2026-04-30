import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { STORAGE_KEYS } from '@/shared/constants'

export function usePendingDescription(enabled: boolean) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!enabled) return

    chrome.storage.local.get(
      STORAGE_KEYS.PENDING_DESCRIPTION,
      (result: { pendingDescription?: string }) => {
        if (result.pendingDescription) navigate('/add-job')
      },
    )

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[STORAGE_KEYS.PENDING_DESCRIPTION]?.newValue) navigate('/add-job')
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [enabled, navigate])
}
