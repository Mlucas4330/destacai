'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import VerifyCodeForm from '@/features/auth/components/VerifyCodeForm'
import { useAuthStore } from '@/features/auth/stores/auth'

const VerifyCode = () => {
  const router = useRouter()
  const verif = useAuthStore((s) => s.pendingVerification)

  if (!verif) {
    return (
      <div className='flex flex-col gap-5 p-5 h-full justify-center'>
        <p className='text-sm text-navy-muted text-center'>Invalid page state.</p>
        <Link href='/sign-up' className='text-xs text-center text-navy underline underline-offset-2'>
          Start over
        </Link>
      </div>
    )
  }

  const { email, purpose } = verif
  const title = purpose === 'email-verification' ? 'Verify your email' : 'Enter the code'
  const subtitle =
    purpose === 'email-verification'
      ? 'Check your inbox for the 6-digit code we sent to'
      : 'Enter the 6-digit code we sent to'
  return (
    <div className='flex flex-col gap-5 p-5'>
      <button
        onClick={() => router.back()}
        className='flex items-center gap-1 text-xs text-navy-muted hover:text-navy transition-colors self-start'
      >
        <ArrowLeft size={14} /> Back
      </button>
      <div>
        <h1 className='text-lg font-semibold text-navy'>{title}</h1>
        <p className='text-sm text-navy-muted mt-0.5'>{subtitle}</p>
        <p className='text-sm text-navy font-medium mt-0.5'>{email}</p>
      </div>
      <VerifyCodeForm email={email} purpose={purpose} />
    </div>
  )
}

export default VerifyCode
