'use client'

import { useRef } from 'react'
import { signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, Trash2, Upload, Mail, Linkedin } from 'lucide-react'
import { useUser, useUploadCV, useDeleteCV } from '../hooks/useUser'
import { queryClient, persister } from '@/lib/queryClient'
import Button from '@/shared/components/Button'
import IconButton from '@/shared/components/IconButton'

const ConfigForm = () => {
  const { data: user } = useUser()
  const uploadCV = useUploadCV()
  const deleteCV = useDeleteCV()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadCV.mutate(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleSignOut = async () => {
    await persister.removeClient()
    queryClient.clear()
    await signOut({ redirectTo: '/sign-in' })
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
            htmlFor='cv-upload'
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            whileTap={{ scale: 0.98 }}
            className='flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-dashed border-border hover:border-navy-muted hover:bg-surface transition-colors cursor-pointer'
          >
            <Upload size={14} className='text-navy-muted' />
            <span className='text-xs text-navy-muted'>Upload PDF (max 10 MB)</span>
          </motion.label>
        )}
      </AnimatePresence>
      <input
        ref={inputRef}
        id='cv-upload'
        type='file'
        accept='application/pdf'
        onChange={handleFileChange}
        className='sr-only'
      />
    </div>
  )

  const supportSection = (
    <div className='flex flex-col gap-1.5'>
      <p className='text-xs font-medium text-navy-muted'>Contact support</p>
      <div className='flex gap-2'>
        <a
          href='https://mail.google.com/mail/?view=cm&fs=1&to=mlucas4330@gmail.com'
          target='_blank'
          rel='noreferrer'
          className='flex items-center gap-1.5 text-xs text-navy-muted hover:text-navy transition-colors'
        >
          <Mail size={13} /> Email
        </a>
        <a
          href='https://www.linkedin.com/in/lucas-medeiros-dev/'
          target='_blank'
          rel='noreferrer'
          className='flex items-center gap-1.5 text-xs text-navy-muted hover:text-navy transition-colors'
        >
          <Linkedin size={13} /> LinkedIn
        </a>
      </div>
    </div>
  )

  return (
    <div className='flex flex-col gap-6'>
      {cvSection}

      <Button variant='secondary' className='text-xs w-full' onClick={handleSignOut}>
        Sign out
      </Button>

      {supportSection}
    </div>
  )
}

export default ConfigForm
