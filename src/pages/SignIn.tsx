import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthContext } from '@features/auth/context/AuthContext'
import Button from '@shared/components/Button'
import Input from '@shared/components/Input'

const API_URL = import.meta.env.VITE_API_URL as string

const SignIn = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthContext()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Sign in failed')
        return
      }
      await login(data.token, data.user.email)
      navigate('/', { replace: true })
    } catch {
      toast.error('Could not reach server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-5 p-5 h-full justify-center'>
      <div>
        <h1 className='text-lg font-semibold text-navy'>Sign in</h1>
        <p className='text-xs text-navy-muted mt-0.5'>Welcome back to DestacAI</p>
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
        <Input
          id='password'
          label='Password'
          type='password'
          value={password}
          onChange={setPassword}
          autoComplete='current-password'
          required
        />
        <div className='flex justify-end'>
          <Link to='/forgot-password' className='text-xs text-navy-muted underline underline-offset-2'>
            Forgot password?
          </Link>
        </div>
        <Button type='submit' variant='primary' className='w-full' disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className='text-xs text-center text-navy-muted'>
        Don't have an account?{' '}
        <Link to='/sign-up' className='text-navy underline underline-offset-2'>
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default SignIn
