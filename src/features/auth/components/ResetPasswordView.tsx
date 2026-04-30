import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ResetPasswordForm from './ResetPasswordForm'

const ResetPasswordView = () => {
  const { state } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!state?.email || !state?.code) {
      navigate('/forgot-password', { replace: true })
    }
  }, [state, navigate])

  if (!state?.email || !state?.code) return null

  const { email, code } = state as { email: string; code: string }

  return (
    <div className='flex flex-col gap-5 p-5 h-full justify-center'>
      <div>
        <h1 className='text-lg font-semibold text-navy'>New password</h1>
        <p className='text-xs text-navy-muted mt-0.5'>Choose a new password for your account.</p>
      </div>
      <ResetPasswordForm email={email} code={code} />
    </div>
  )
}

export default ResetPasswordView
