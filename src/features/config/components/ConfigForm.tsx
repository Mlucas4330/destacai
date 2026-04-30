import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/features/auth/stores/auth'
import { useGuestContext } from '@/features/auth/stores/GuestContext'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, Trash2, Upload, ExternalLink } from 'lucide-react'
import { useUser, useUploadCV, useDeleteCV } from '../hooks/useUser'
import { createApiClient } from '@/lib/api.client'
import Button from '@/shared/components/Button'
import IconButton from '@/shared/components/IconButton'
import { MAX_SIZE_BYTES, MAX_SIZE_MB, FREE_TIER_LIMIT } from '@/shared/constants'

const ConfigForm = () => {
  const { signOut, getToken, isSignedIn } = useAuthContext()
  const { guestGenerationsUsed } = useGuestContext()
  const { data: user } = useUser()
  const uploadCV = useUploadCV()
  const deleteCV = useDeleteCV()
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('File size must be 10 MB or less.')
      return
    }
    uploadCV.mutate(file, {
      onError: (err) => toast.error(err.message ?? 'Upload failed.'),
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleUpgrade = async () => {
    try {
      const api = createApiClient(getToken)
      const { checkoutUrl } = await api.post<{ checkoutUrl: string }>('/stripe/checkout')
      chrome.tabs.create({ url: checkoutUrl })
    } catch {
      toast.error('Failed to start checkout. Please try again.')
    }
  }

  const cvSection = (
    <div className='flex flex-col gap-1'>
      <label className='text-xs font-medium text-navy-muted'>CV (PDF)</label>
      <AnimatePresence mode='wait'>
        {user?.cvFileName ? (
          <motion.div
            key='uploaded'
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className='flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-surface'
          >
            <div className='flex items-center gap-2 min-w-0'>
              <FileText size={14} className='text-accent-text shrink-0' />
              <span className='text-xs text-navy truncate'>{user.cvFileName}</span>
            </div>
            <IconButton
              icon={Trash2}
              label='Remove CV'
              variant='danger'
              onClick={() => deleteCV.mutate()}
              size={14}
            />
          </motion.div>
        ) : (
          <motion.label
            key='upload'
            htmlFor="cv-upload"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            whileTap={{ scale: 0.98 }}
            className='flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-dashed border-border hover:border-navy-muted hover:bg-surface transition-colors cursor-pointer'
          >
            <Upload size={14} className='text-navy-muted' />
            <span className='text-xs text-navy-muted'>Upload PDF (max {MAX_SIZE_MB} MB)</span>
          </motion.label>
        )}
      </AnimatePresence>
      <input
        ref={inputRef}
        id="cv-upload"
        type='file'
        accept='application/pdf'
        onChange={handleFileChange}
        className='sr-only'
      />
    </div>
  )

  if (!isSignedIn) {
    return (
      <div className='flex flex-col gap-6'>
        <div>
          <p className='text-xs font-medium text-navy-muted'>CV Generations</p>
          <p className='text-sm text-navy'>{guestGenerationsUsed} / {FREE_TIER_LIMIT} free</p>
        </div>

        {cvSection}

        <div className='flex flex-col gap-2'>
          <Button variant='primary' className='w-full text-xs' onClick={() => navigate('/sign-up')}>
            Create free account
          </Button>
          <Button variant='secondary' className='w-full text-xs' onClick={() => navigate('/sign-in')}>
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-xs font-medium text-navy-muted'>Plan</p>
            <p className='text-sm font-semibold text-navy capitalize'>{user?.tier ?? '-'}</p>
          </div>
          {user?.tier === 'free' && (
            <Button
              variant='primary'
              className='text-xs px-3 py-1.5'
              onClick={handleUpgrade}
            >
              Upgrade <ExternalLink size={11} className='inline ml-1' />
            </Button>
          )}
        </div>

        <div>
          <p className='text-xs font-medium text-navy-muted'>CV Generations</p>
          <p className='text-sm text-navy'>
            {user?.tier === 'paid'
              ? 'Unlimited'
              : `${user?.generationsUsed ?? 0} / ${user?.generationsLimit ?? 5} this month`}
          </p>
        </div>
      </div>

      {cvSection}

      <Button
        variant='secondary'
        className='text-xs w-full'
        onClick={() => signOut()}
      >
        Sign out
      </Button>
    </div>
  )
}

export default ConfigForm
