import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'
import { useForgotPassword } from '../hooks/useForgotPassword'

const ForgotPasswordForm = () => {
  const { register, formState, onSubmit, isPending } = useForgotPassword()

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
      <Button type='submit' variant='primary' className='w-full' disabled={isPending}>
        {isPending ? 'Sending…' : 'Send code'}
      </Button>
    </form>
  )
}

export default ForgotPasswordForm
