import Link from 'next/link'
import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'
import { useSignIn } from '../hooks/useSignIn'

const SignInForm = () => {
  const { register, formState, onSubmit, isPending } = useSignIn()

  return (
    <form onSubmit={onSubmit} className='flex flex-col gap-3'>
      <Input
        id='email'
        label='Email'
        type='email'
        autoComplete='email'
        error={formState.errors.email?.message}
        {...register('email')}
      />
      <Input
        id='password'
        label='Password'
        type='password'
        autoComplete='current-password'
        error={formState.errors.password?.message}
        {...register('password')}
      />
      <div className='flex justify-end'>
        <Link href='/forgot-password' className='text-xs text-navy-muted underline underline-offset-2'>
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
