import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'
import { useSignUp } from '../hooks/useSignUp'

const SignUpForm = () => {
  const { register, formState, onSubmit, isPending } = useSignUp()

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
      <div className='flex flex-col gap-1'>
        <Input
          id='password'
          label='Password'
          type='password'
          autoComplete='new-password'
          error={formState.errors.password?.message}
          {...register('password')}
        />
        <p className='text-xs text-navy-muted'>Minimum 8 characters</p>
      </div>
      <Button type='submit' variant='primary' className='w-full' disabled={isPending}>
        {isPending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}

export default SignUpForm
