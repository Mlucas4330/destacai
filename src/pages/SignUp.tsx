import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthContext } from '@features/auth/context/AuthContext'
import Button from '@shared/components/Button'
import Input from '@shared/components/Input'
import { STORAGE_KEYS } from '@shared/constants'

const API_URL = import.meta.env.VITE_API_URL as string

interface SignUpDraft {
  firstName: string
  lastName: string
  email: string
}

const SignUp = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  useAuthContext()
  const navigate = useNavigate()

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEYS.PENDING_SIGNUP, (result) => {
      const draft = result[STORAGE_KEYS.PENDING_SIGNUP] as SignUpDraft | undefined
      if (draft) {
        if (draft.firstName) setFirstName(draft.firstName)
        if (draft.lastName) setLastName(draft.lastName)
        if (draft.email) setEmail(draft.email)
      }
    })
  }, [])

  const saveDraft = (patch: Partial<SignUpDraft>) => {
    chrome.storage.local.get(STORAGE_KEYS.PENDING_SIGNUP, (result) => {
      const current = (result[STORAGE_KEYS.PENDING_SIGNUP] as SignUpDraft | undefined) ?? { firstName, lastName, email }
      chrome.storage.local.set({ [STORAGE_KEYS.PENDING_SIGNUP]: { ...current, ...patch } })
    })
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Registration failed')
        return
      }
      await chrome.storage.local.remove(STORAGE_KEYS.PENDING_SIGNUP)
      await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_VERIFICATION]: { email, purpose: 'email-verification' } })
      navigate('/verify-code', { state: { email, purpose: 'email-verification' } })
    } catch {
      toast.error('Could not reach server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-5 p-5 h-full justify-center'>
      <div>
        <h1 className='text-lg font-semibold text-navy'>Create account</h1>
        <p className='text-xs text-navy-muted mt-0.5'>Start using DestacAI for free</p>
      </div>
      <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
        <Input
          id='firstName'
          label='First name'
          type='text'
          value={firstName}
          onChange={(v) => { setFirstName(v); saveDraft({ firstName: v }) }}
          autoComplete='given-name'
          required
        />
        <Input
          id='lastName'
          label='Last name'
          type='text'
          value={lastName}
          onChange={(v) => { setLastName(v); saveDraft({ lastName: v }) }}
          autoComplete='family-name'
          required
        />
        <Input
          id='email'
          label='Email'
          type='email'
          value={email}
          onChange={(v) => { setEmail(v); saveDraft({ email: v }) }}
          autoComplete='email'
          required
        />
        <div className='flex flex-col gap-1'>
          <Input
            id='password'
            label='Password'
            type='password'
            value={password}
            onChange={setPassword}
            autoComplete='new-password'
            required
            minLength={8}
          />
          <p className='text-xs text-navy-muted'>Minimum 8 characters</p>
        </div>
        <Button type='submit' variant='primary' className='w-full' disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className='text-xs text-center text-navy-muted'>
        Already have an account?{' '}
        <Link to='/sign-in' className='text-navy underline underline-offset-2'>
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default SignUp
