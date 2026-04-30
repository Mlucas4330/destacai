import { Link } from 'react-router-dom'
import SignUpForm from '@/features/auth/components/SignUpForm'

const SignUp = () => {
  return (
    <div className='flex flex-col gap-5 p-5 h-full justify-center'>
      <div>
        <h1 className='text-lg font-semibold text-navy'>Create account</h1>
        <p className='text-xs text-navy-muted mt-0.5'>Start using DestacAI for free</p>
      </div>
      <SignUpForm />
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
