import Button from '@/shared/components/Button'
import { usePasswordResetVerification } from '../hooks/usePasswordResetVerification'
import type { VerifyCodeFormProps } from '../types'

const inputClass = 'w-full text-center text-2xl tracking-widest font-mono px-3 py-3 rounded-xl border border-border focus:border-navy-muted bg-bg outline-none transition-colors'

const VerifyCodeForm = ({ email }: VerifyCodeFormProps) => {
  const { codeField, handleCodeChange, code, onSubmit, isPending } = usePasswordResetVerification({ email })
  return (
    <form onSubmit={onSubmit} className='flex flex-col gap-3'>
      <input {...codeField} onChange={handleCodeChange} type='text' inputMode='numeric' pattern='[0-9]*' maxLength={6} placeholder='000000' className={inputClass} />
      <Button type='submit' variant='primary' className='w-full' disabled={code?.length !== 6 || isPending}>
        {isPending ? 'Verifying…' : 'Confirm'}
      </Button>
    </form>
  )
}

export default VerifyCodeForm
