import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthContext } from '@features/auth/context/AuthContext'
import Button from '@shared/components/Button'

const API_URL = import.meta.env.VITE_API_URL as string

const VerifyCode = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { login, pendingVerification, clearPendingVerification } = useAuthContext()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const verif = (state as { email: string; purpose: 'email-verification' | 'password-reset' } | null) ?? pendingVerification

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

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (code.length !== 6) return

    if (purpose === 'password-reset') {
      await clearPendingVerification()
      navigate('/reset-password', { state: { email, code } })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Invalid or expired code.')
        return
      }
      await clearPendingVerification()
      await login(data.token, data.user.email)
      navigate('/', { replace: true })
    } catch {
      toast.error('Could not reach server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const backPath = purpose === 'email-verification' ? '/sign-up' : '/forgot-password'
  const title = purpose === 'email-verification' ? 'Verify your email' : 'Enter the code'
  const subtitle = purpose === 'email-verification'
    ? 'Check your inbox for the 6-digit code we sent to'
    : 'Enter the 6-digit code we sent to'

  return (
    <div className='flex flex-col gap-5 p-5 h-full justify-center'>
      <div>
        <h1 className='text-lg font-semibold text-navy'>{title}</h1>
        <p className='text-xs text-navy-muted mt-0.5'>{subtitle}</p>
        <p className='text-xs text-navy font-medium mt-0.5'>{email}</p>
      </div>
      <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
        <input
          type='text'
          inputMode='numeric'
          pattern='[0-9]*'
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder='000000'
          className='w-full text-center text-2xl tracking-widest font-mono px-3 py-3 rounded-xl border border-border focus:border-navy-muted bg-bg outline-none transition-colors'
        />
        <Button type='submit' variant='primary' className='w-full' disabled={code.length !== 6 || loading}>
          {loading ? 'Verifying...' : 'Confirm'}
        </Button>
      </form>
      <p className='text-xs text-center text-navy-muted'>
        <Link to={backPath} className='text-navy underline underline-offset-2'>
          Back
        </Link>
      </p>
    </div>
  )
}

export default VerifyCode
