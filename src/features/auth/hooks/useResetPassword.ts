import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ApiError } from '@/lib/api.client'
import { resetPassword } from '../services/auth'
import { ResetPasswordSchema } from '../schemas'
import type { ResetPasswordFormProps } from '../types'

export function useResetPassword({ email, code }: ResetPasswordFormProps) {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: ({ newPassword }: { newPassword: string }) =>
      resetPassword(email, code, newPassword),
    onSuccess: () => {
      toast.success('Password updated.')
      navigate('/sign-in', { replace: true })
    },
    onError(err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Could not reach server. Please try again.')
      }
    },
  })

  const submit = (newPassword: string, confirmPassword: string) => {
    const result = ResetPasswordSchema.safeParse({ newPassword, confirmPassword })
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }
    mutation.mutate({ newPassword: result.data.newPassword })
  }

  return { submit, isPending: mutation.isPending }
}
