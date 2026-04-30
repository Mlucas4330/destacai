import { motion } from 'framer-motion'
import { useGuestContext } from '@/features/auth/stores/GuestContext'
import Button from '@/shared/components/Button'

export default function GuestLimitModal() {
  const { handleSignIn, handleSignUp, dismissLimitModal, showLimitModal } = useGuestContext()

  if (!showLimitModal) return

  return (
    <div className='absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className='bg-bg rounded-2xl border border-border shadow-lg p-5 w-full max-w-xs flex flex-col gap-4'
      >
        <div>
          <p className='text-sm font-semibold text-navy'>You've used all 5 free generations</p>
          <p className='text-xs text-navy-muted mt-1'>
            Sign up to get 5 more every month. Your saved jobs will be imported automatically.
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          <Button variant='primary' className='w-full text-xs' onClick={handleSignUp}>
            Create free account
          </Button>
          <Button variant='secondary' className='w-full text-xs' onClick={handleSignIn}>
            Sign in
          </Button>
          <button
            type='button'
            onClick={dismissLimitModal}
            className='text-xs text-navy-muted hover:text-navy transition-colors py-1'
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </div>
  )
}
