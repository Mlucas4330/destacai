// import { useState } from 'react'
// import { useMutation } from '@tanstack/react-query'
// import { useNavigate } from 'react-router-dom'
// import toast from 'react-hot-toast'
// import { ApiError } from '@/lib/api.client'
// import { verifyCode } from '../services/auth'
// import { useAuthContext } from '../stores/auth'
// import { useMigrateGuest } from './useMigrateGuest'
// import { VerifyCodeSchema } from '../schemas'
// import type { VerifyCodeFormProps } from '../types'

export function useVerifyCode({ email, purpose }: VerifyCodeFormProps) {
  // const [code, setCode] = useState('')
  // const { login, clearPendingVerification } = useAuthContext()
  // const migrateGuest = useMigrateGuest()
  // const navigate = useNavigate()

  // const mutation = useMutation({
  //   mutationFn: () => {
  //     if (purpose === 'password-reset') return Promise.resolve(null)
  //     return verifyCode(email, code)
  //   },
  //   onSuccess: async (data) => {
  //     if (purpose === 'password-reset') {
  //       await clearPendingVerification()
  //       navigate('/reset-password', { state: { email, code } })
  //       return
  //     }
  //     if (!data) return
  //     await clearPendingVerification()
  //     await login(data.token, data.user.email)
  //     await migrateGuest()
  //     navigate('/', { replace: true })
  //   },
  //   onError(err) {
  //     if (err instanceof ApiError) {
  //       toast.error(err.message)
  //     } else {
  //       toast.error('Could not reach server. Please try again.')
  //     }
  //   },
  // })

  // const handleCodeChange = (v: string) => setCode(v.replace(/\D/g, '').slice(0, 6))

  // const submit = () => {
  //   const result = VerifyCodeSchema.safeParse({ code })
  //   if (!result.success) {
  //     toast.error(result.error.issues[0].message)
  //     return
  //   }
  //   mutation.mutate()
  // }

  // return { code, handleCodeChange, submit, isPending: mutation.isPending }
}
