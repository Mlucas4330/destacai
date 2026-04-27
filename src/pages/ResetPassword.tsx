import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '@shared/components/Button'
import Input from '@shared/components/Input'

const API_URL = import.meta.env.VITE_API_URL as string

const ResetPassword = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!state?.email || !state?.code) {
      navigate('/forgot-password', { replace: true })
    }
  }, [state, navigate])

  if (!state?.email || !state?.code) return null

  const { email, code } = state as { email: string; code: string }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to reset password.')
        return
      }
      toast.success('Password updated.')
      navigate('/sign-in', { replace: true })
    } catch {
      toast.error('Could not reach server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-5 p-5 h-full justify-center'>
      <div>
        <h1 className='text-lg font-semibold text-navy'>New password</h1>
        <p className='text-xs text-navy-muted mt-0.5'>Choose a new password for your account.</p>
      </div>
      <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
        <div className='flex flex-col gap-1'>
          <Input
            id='new-password'
            label='New password'
            type='password'
            value={newPassword}
            onChange={setNewPassword}
            autoComplete='new-password'
            required
            minLength={8}
          />
          <p className='text-xs text-navy-muted'>Minimum 8 characters</p>
        </div>
        <Input
          id='confirm-password'
          label='Confirm password'
          type='password'
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete='new-password'
          required
        />
        <Button type='submit' variant='primary' className='w-full' disabled={loading}>
          {loading ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </div>
  )
}

export default ResetPassword
