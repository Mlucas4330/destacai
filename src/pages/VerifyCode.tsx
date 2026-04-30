import VerifyCodeForm from '@/features/auth/components/VerifyCodeForm'
import { useAuthStore } from '@/features/auth/stores/auth'
import { Link, useLocation } from 'react-router-dom'

const VerifyCode = () => {
  const { state } = useLocation()
  const { pendingVerification } = useAuthStore()
  const verif =
    (state as { email: string; purpose: 'email-verification' | 'password-reset' } | null) ??
    pendingVerification

  if (!verif) {
    return (
      <div className='flex flex-col gap-5 p-5 h-full justify-center'>
        <p className='text-sm text-navy-muted text-center'>Invalid page state.</p>
        <Link to='/sign-up' className='text-xs text-center text-navy underline underline-offset-2'>
          Start over
        </Link>
      </div>
    )
  }

  const { email, purpose } = verif
  const backPath = purpose === 'email-verification' ? '/sign-up' : '/forgot-password'
  const title = purpose === 'email-verification' ? 'Verify your email' : 'Enter the code'
  const subtitle =
    purpose === 'email-verification'
      ? 'Check your inbox for the 6-digit code we sent to'
      : 'Enter the 6-digit code we sent to'
  return (


    <div className='flex flex-col gap-5 p-5 h-full justify-center'>
      <div>
        <h1 className='text-lg font-semibold text-navy'>{title}</h1>
        <p className='text-xs text-navy-muted mt-0.5'>{subtitle}</p>
        <p className='text-xs text-navy font-medium mt-0.5'>{email}</p>
      </div>
      <VerifyCodeForm email={email} purpose={purpose} />
      <p className='text-xs text-center text-navy-muted'>
        <Link to={backPath} className='text-navy underline underline-offset-2'>
          Back
        </Link>
      </p>
    </div>
  )
}

export default VerifyCode
