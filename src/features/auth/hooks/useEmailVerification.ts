import type React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { signIn as nextSignIn } from 'next-auth/react'
import toast from 'react-hot-toast'
import type { z } from 'zod'
import { verifyCode } from '../api'
import { useAuthStore } from '../stores/auth'
import { VerifyCodeSchema } from '../schemas'

type VerifyCodeInput = z.infer<typeof VerifyCodeSchema>

export function useEmailVerification({ email }: { email: string }) {
  const { register, handleSubmit, formState, setValue, control } = useForm<VerifyCodeInput>({
    resolver: zodResolver(VerifyCodeSchema),
    defaultValues: { code: '' },
  })
  const router = useRouter()
  const qc = useQueryClient()
  const clearPendingVerification = useAuthStore((s) => s.clearPendingVerification)
  const code = useWatch({ control, name: 'code' })

  const mutation = useMutation({
    mutationFn: (data: VerifyCodeInput) => verifyCode(email, data.code),
    onSuccess: async () => {
      const password = useAuthStore.getState().pendingPassword
      clearPendingVerification()
      // Auto sign-in if we still hold the password from sign-up; otherwise ask
      // the user to sign in.
      if (password) {
        const res = await nextSignIn('credentials', { email, password, redirect: false })
        if (res && !res.error) {
          qc.invalidateQueries()
          router.replace('/')
          return
        }
      }
      toast.success('Email verified. Please sign in.')
      router.replace('/sign-in')
    },
    onError(err: Error) {
      toast.error(err.message ?? 'Could not reach server. Please try again.')
    },
  })

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value.replace(/\D/g, '').slice(0, 6)
    setValue('code', formatted, { shouldValidate: !!formState.errors.code })
  }

  return {
    codeField: register('code'),
    handleCodeChange,
    code,
    formState,
    onSubmit: handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
  }
}
