import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { signIn as nextSignIn } from 'next-auth/react'
import toast from 'react-hot-toast'
import type { z } from 'zod'
import { SignInSchema } from '../schemas'

type SignInInput = z.infer<typeof SignInSchema>

export function useSignIn() {
  const { register, handleSubmit, formState } = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
  })
  const router = useRouter()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: SignInInput) => {
      const res = await nextSignIn('credentials', { ...data, redirect: false })
      if (!res || res.error) throw new Error('Invalid email or password.')
      return res
    },
    onSuccess: () => {
      qc.invalidateQueries()
      router.replace('/')
    },
    onError(err: Error) {
      toast.error(err.message ?? 'An unexpected error occurred.')
    },
  })

  const onSubmit = handleSubmit((data) => mutation.mutate(data))

  return { register, formState, onSubmit, isPending: mutation.isPending }
}
