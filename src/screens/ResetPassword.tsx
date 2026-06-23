'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm'
import { useAuthStore } from '@/features/auth/stores/auth'

const ResetPassword = () => {
  const router = useRouter()
  const pendingReset = useAuthStore((s) => s.pendingReset)

  useEffect(() => {
    if (!pendingReset) router.replace('/forgot-password')
  }, [pendingReset, router])

  if (!pendingReset) return null

  const { email, code } = pendingReset

  return (
    <div className='flex flex-col gap-5 p-5'>
      <button
        onClick={() => router.back()}
        className='flex items-center gap-1 text-xs text-navy-muted hover:text-navy transition-colors self-start'
      >
        <ArrowLeft size={14} /> Back
      </button>
      <div>
        <h1 className='text-lg font-semibold text-navy'>New password</h1>
        <p className='text-sm text-navy-muted mt-0.5'>Choose a new password for your account.</p>
      </div>
      <ResetPasswordForm email={email} code={code} />
    </div>
  )
}

export default ResetPassword
