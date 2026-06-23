'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm'

const ForgotPassword = () => {
  const router = useRouter()
  return (
    <div className='flex flex-col gap-5 p-5'>
      <button
        onClick={() => router.back()}
        className='flex items-center gap-1 text-xs text-navy-muted hover:text-navy transition-colors self-start'
      >
        <ArrowLeft size={14} /> Back
      </button>
      <div>
        <h1 className='text-lg font-semibold text-navy'>Forgot password</h1>
        <p className='text-sm text-navy-muted mt-0.5'>Enter your email and we&apos;ll send you a code.</p>
      </div>
      <ForgotPasswordForm />
      <p className='text-xs text-center text-navy-muted'>
        Remembered it?{' '}
        <Link href='/sign-in' className='text-navy underline underline-offset-2'>
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default ForgotPassword
