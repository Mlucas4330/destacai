import { useState } from 'react'
import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'
import { useResetPassword } from '../hooks/useResetPassword'
import type { ResetPasswordFormProps } from '../types'

const ResetPasswordForm = ({ email, code }: ResetPasswordFormProps) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { submit, isPending } = useResetPassword({ email, code })

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(newPassword, confirmPassword) }} className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1'>
        <Input id='new-password' label='New password' type='password' value={newPassword} onChange={setNewPassword} autoComplete='new-password' required minLength={8} />
        <p className='text-xs text-navy-muted'>Minimum 8 characters</p>
      </div>
      <Input id='confirm-password' label='Confirm password' type='password' value={confirmPassword} onChange={setConfirmPassword} autoComplete='new-password' required />
      <Button type='submit' variant='primary' className='w-full' disabled={isPending}>
        {isPending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  )
}

export default ResetPasswordForm
