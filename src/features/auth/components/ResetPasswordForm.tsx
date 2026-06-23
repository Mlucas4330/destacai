import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'
import { useResetPassword } from '../hooks/useResetPassword'
import type { ResetPasswordFormProps } from '../types'

const ResetPasswordForm = ({ email, code }: ResetPasswordFormProps) => {
  const { register, formState, onSubmit, isPending } = useResetPassword({ email, code })

  return (
    <form onSubmit={onSubmit} className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1'>
        <Input
          id='new-password'
          label='New password'
          type='password'
          autoComplete='new-password'
          error={formState.errors.newPassword?.message}
          {...register('newPassword')}
        />
        <p className='text-xs text-navy-muted'>Minimum 8 characters</p>
      </div>
      <Input
        id='confirm-password'
        label='Confirm password'
        type='password'
        autoComplete='new-password'
        error={formState.errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type='submit' variant='primary' className='w-full' disabled={isPending}>
        {isPending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  )
}

export default ResetPasswordForm
