import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ApiError } from '@/lib/api.client'
import { forgotPassword } from '../services/auth'
import { STORAGE_KEYS } from '../constants'
import { ForgotPasswordSchema } from '../schemas'

export function useForgotPassword() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: ({ email }: { email: string }) => forgotPassword(email),
    onSuccess: async (_, { email }) => {
      await chrome.storage.local.set({
        [STORAGE_KEYS.PENDING_VERIFICATION]: { email, purpose: 'password-reset' },
      })
      navigate('/verify-code', { state: { email, purpose: 'password-reset' } })
    },
    onError(err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Could not reach server. Please try again.')
      }
    },
  })

  const submit = (email: string) => {
    const result = ForgotPasswordSchema.safeParse({ email })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }
    mutation.mutate(result.data)
  }

  return { submit, isPending: mutation.isPending }
}
