import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { z } from 'zod'
import { signUp } from '../api'
import { useAuthStore } from '../stores/auth'
import { storageClient } from '@/lib/storageClient'
import { STORAGE_KEYS } from '../constants'
import { SignUpSchema } from '../schemas'

type SignUpInput = z.infer<typeof SignUpSchema>

export function useSignUp() {
  const { register, handleSubmit, formState, setValue, control } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
  })
  const router = useRouter()
  const setPendingVerification = useAuthStore((s) => s.setPendingVerification)
  const email = useWatch({ control, name: 'email' })

  useEffect(() => {
    storageClient.get<{ email?: string }>(STORAGE_KEYS.PENDING_SIGNUP).then((draft) => {
      if (draft?.email) setValue('email', draft.email)
    })
  }, [setValue])

  useEffect(() => {
    if (!email) return
    storageClient.get<{ email?: string }>(STORAGE_KEYS.PENDING_SIGNUP).then((current) => {
      storageClient.set(STORAGE_KEYS.PENDING_SIGNUP, { ...current, email })
    })
  }, [email])

  const mutation = useMutation({
    mutationFn: (data: SignUpInput) => signUp(data.email, data.password),
    onSuccess: async (_, { email, password }) => {
      await storageClient.remove(STORAGE_KEYS.PENDING_SIGNUP)
      setPendingVerification({ email, purpose: 'email-verification' }, password)
      router.push('/verify-code')
    },
    onError(err: Error) {
      toast.error(err.message ?? 'Could not reach server. Please try again.')
    },
  })

  const onSubmit = handleSubmit((data) => mutation.mutate(data))

  return { register, formState, onSubmit, isPending: mutation.isPending }
}
