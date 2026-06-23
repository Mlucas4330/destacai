import type React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import type { z } from 'zod'
import { useAuthStore } from '../stores/auth'
import { VerifyCodeSchema } from '../schemas'

type VerifyCodeInput = z.infer<typeof VerifyCodeSchema>

export function usePasswordResetVerification({ email }: { email: string }) {
  const { register, handleSubmit, formState, setValue, control } = useForm<VerifyCodeInput>({
    resolver: zodResolver(VerifyCodeSchema),
    defaultValues: { code: '' },
  })
  const router = useRouter()
  const setPendingReset = useAuthStore((s) => s.setPendingReset)
  const clearPendingVerification = useAuthStore((s) => s.clearPendingVerification)
  const code = useWatch({ control, name: 'code' })

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value.replace(/\D/g, '').slice(0, 6)
    setValue('code', formatted, { shouldValidate: !!formState.errors.code })
  }

  const onSubmit = handleSubmit((data) => {
    setPendingReset({ email, code: data.code })
    clearPendingVerification()
    router.push('/reset-password')
  })

  return {
    codeField: register('code'),
    handleCodeChange,
    code,
    formState,
    onSubmit,
    isPending: false,
  }
}
