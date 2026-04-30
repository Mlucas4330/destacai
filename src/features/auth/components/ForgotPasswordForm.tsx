import { useState } from 'react'
import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'
import { useForgotPassword } from '../hooks/useForgotPassword'

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('')
  const { submit, isPending } = useForgotPassword()

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(email) }} className='flex flex-col gap-3'>
      <Input id='email' label='Email' type='email' value={email} onChange={setEmail} autoComplete='email' required />
      <Button type='submit' variant='primary' className='w-full' disabled={isPending}>
        {isPending ? 'Sending…' : 'Send code'}
      </Button>
    </form>
  )
}

export default ForgotPasswordForm
