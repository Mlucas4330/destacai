import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '@shared/components/Button'
import Input from '@shared/components/Input'
import { STORAGE_KEYS } from '@shared/constants'

const API_URL = import.meta.env.VITE_API_URL as string

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_VERIFICATION]: { email, purpose: 'password-reset' } })
      navigate('/verify-code', { state: { email, purpose: 'password-reset' } })
    } catch {
      toast.error('Could not reach server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-5 p-5 h-full justify-center'>
      <div>
        <h1 className='text-lg font-semibold text-navy'>Forgot password</h1>
        <p className='text-xs text-navy-muted mt-0.5'>Enter your email and we'll send you a code.</p>
      </div>
      <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
        <Input
          id='email'
          label='Email'
          type='email'
          value={email}
          onChange={setEmail}
          autoComplete='email'
          required
        />
        <Button type='submit' variant='primary' className='w-full' disabled={loading}>
          {loading ? 'Sending...' : 'Send code'}
        </Button>
      </form>
      <p className='text-xs text-center text-navy-muted'>
        Remembered it?{' '}
        <Link to='/sign-in' className='text-navy underline underline-offset-2'>
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default ForgotPassword
