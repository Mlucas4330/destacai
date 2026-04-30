import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ApiError } from '@/lib/api.client'
import { signUp } from '../services/auth'
import { STORAGE_KEYS } from '../constants'
import { SignUpSchema } from '../schemas'

export function useSignUp() {
  const [email, setEmailState] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEYS.PENDING_SIGNUP, (result) => {
      const draft = result[STORAGE_KEYS.PENDING_SIGNUP] as { email?: string } | undefined
      if (draft?.email) setEmailState(draft.email)
    })
  }, [])

  const handleEmailChange = (v: string) => {
    setEmailState(v)
    chrome.storage.local.get(STORAGE_KEYS.PENDING_SIGNUP, (r) => {
      const current = (r[STORAGE_KEYS.PENDING_SIGNUP] as { email?: string } | undefined) ?? {}
      chrome.storage.local.set({ [STORAGE_KEYS.PENDING_SIGNUP]: { ...current, email: v } })
    })
  }

  const mutation = useMutation({
    mutationFn: ({ password }: { password: string }) => signUp(email, password),
    onSuccess: async () => {
      await chrome.storage.local.remove(STORAGE_KEYS.PENDING_SIGNUP)
      await chrome.storage.local.set({
        [STORAGE_KEYS.PENDING_VERIFICATION]: { email, purpose: 'email-verification' },
      })
      navigate('/verify-code', { state: { email, purpose: 'email-verification' } })
    },
    onError(err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Could not reach server. Please try again.')
      }
    },
  })

  const submit = (password: string) => {
    const result = SignUpSchema.safeParse({ email, password })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }
    mutation.mutate({ password })
  }

  return { email, handleEmailChange, submit, isPending: mutation.isPending }
}
