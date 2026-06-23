import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { z } from 'zod'
import { forgotPassword } from '../api'
import { useAuthStore } from '../stores/auth'
import { ForgotPasswordSchema } from '../schemas'

type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>

export function useForgotPassword() {
  const { register, handleSubmit, formState } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  })
  const router = useRouter()
  const setPendingVerification = useAuthStore((s) => s.setPendingVerification)

  const mutation = useMutation({
    mutationFn: ({ email }: ForgotPasswordInput) => forgotPassword(email),
    onSuccess: (_, { email }) => {
      setPendingVerification({ email, purpose: 'password-reset' })
      router.push('/verify-code')
    },
    onError(err: Error) {
      toast.error(err.message ?? 'Could not reach server. Please try again.')
    },
  })

  const onSubmit = handleSubmit((data) => mutation.mutate(data))

  return { register, formState, onSubmit, isPending: mutation.isPending }
}
