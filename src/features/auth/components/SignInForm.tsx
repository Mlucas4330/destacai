import { Link } from 'react-router-dom'
import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'
import { useSignIn } from '../hooks/useSignIn'

const SignInForm = () => {
  const { email, setEmail, password, setPassword, submit, isPending } = useSignIn()

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(email, password) }} className='flex flex-col gap-3'>
      <Input id='email' label='Email' type='email' value={email} onChange={setEmail} autoComplete='email' required />
      <Input id='password' label='Password' type='password' value={password} onChange={setPassword} autoComplete='current-password' required />
      <div className='flex justify-end'>
        <Link to='/forgot-password' className='text-xs text-navy-muted underline underline-offset-2'>
          Forgot password?
        </Link>
      </div>
      <Button type='submit' variant='primary' className='w-full' disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

export default SignInForm
