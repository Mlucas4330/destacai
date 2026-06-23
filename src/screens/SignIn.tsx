'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import SignInForm from '@/features/auth/components/SignInForm'

const SignIn = () => {
  const router = useRouter()
  return (
    <div className='flex flex-col gap-5 p-5 h-full justify-center'>
      <button
        onClick={() => router.back()}
        className='flex items-center gap-1 text-xs text-navy-muted hover:text-navy transition-colors self-start'
      >
        <ArrowLeft size={14} /> Back
      </button>
      <div>
        <h1 className='text-lg font-semibold text-navy'>Sign in</h1>
        <p className='text-xs text-navy-muted mt-0.5'>Welcome back to DestacAI</p>
      </div>
      <SignInForm />
      <p className='text-xs text-center text-navy-muted'>
        Don&apos;t have an account?{' '}
        <Link href='/sign-up' className='text-navy underline underline-offset-2'>
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default SignIn
