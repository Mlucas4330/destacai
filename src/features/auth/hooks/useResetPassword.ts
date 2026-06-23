import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { z } from 'zod'
import { resetPassword } from '../api'
import { useAuthStore } from '../stores/auth'
import { ResetPasswordSchema } from '../schemas'
import type { ResetPasswordFormProps } from '../types'

type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>

export function useResetPassword({ email, code }: ResetPasswordFormProps) {
  const { register, handleSubmit, formState } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
  })
  const router = useRouter()
  const clearPendingReset = useAuthStore((s) => s.clearPendingReset)

  const mutation = useMutation({
    mutationFn: ({ newPassword }: ResetPasswordInput) => resetPassword(email, code, newPassword),
    onSuccess: () => {
      clearPendingReset()
      toast.success('Password updated.')
      router.replace('/sign-in')
    },
    onError(err: Error) {
      toast.error(err.message ?? 'Could not reach server. Please try again.')
    },
  })

  const onSubmit = handleSubmit((data) => mutation.mutate(data))

  return { register, formState, onSubmit, isPending: mutation.isPending }
}
