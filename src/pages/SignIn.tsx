import SignInForm from '@/features/auth/components/SignInForm'
import { Link } from 'react-router-dom'

const SignIn = () => {
  return (
    <div className='flex flex-col gap-5 p-5 h-full justify-center'>
      <div>
        <h1 className='text-lg font-semibold text-navy'>Sign in</h1>
        <p className='text-xs text-navy-muted mt-0.5'>Welcome back to DestacAI</p>
      </div>
      <SignInForm />
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
