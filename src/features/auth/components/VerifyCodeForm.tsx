import Button from '@/shared/components/Button'
import { useVerifyCode } from '../hooks/useVerifyCode'
import type { VerifyCodeFormProps } from '../types'

const VerifyCodeForm = ({ email, purpose }: VerifyCodeFormProps) => {
  const { code, handleCodeChange, submit, isPending } = useVerifyCode({ email, purpose })

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }} className='flex flex-col gap-3'>
      <input
        type='text'
        inputMode='numeric'
        pattern='[0-9]*'
        maxLength={6}
        value={code}
        onChange={(e) => handleCodeChange(e.target.value)}
        placeholder='000000'
        className='w-full text-center text-2xl tracking-widest font-mono px-3 py-3 rounded-xl border border-border focus:border-navy-muted bg-bg outline-none transition-colors'
      />
      <Button type='submit' variant='primary' className='w-full' disabled={code.length !== 6 || isPending}>
        {isPending ? 'Verifying…' : 'Confirm'}
      </Button>
    </form>
  )
}

export default VerifyCodeForm
