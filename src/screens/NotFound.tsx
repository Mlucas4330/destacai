'use client'

import { useRouter } from 'next/navigation'
import { Compass } from 'lucide-react'
import Button from '@/shared/components/Button'

// Branded fallback for unmatched routes with a way back to the app.
const NotFound = () => {
  const router = useRouter()

  return (
    <div className='min-h-screen flex flex-col items-center justify-center gap-4 bg-surface px-6 text-center'>
      <div className='p-4 rounded-full bg-canvas border border-border'>
        <Compass size={28} className='text-navy-muted' />
      </div>
      <div>
        <p className='text-lg font-semibold text-navy'>Page not found</p>
        <p className='text-sm text-navy-muted mt-1.5'>The page you&apos;re looking for doesn&apos;t exist.</p>
      </div>
      <Button variant='primary' className='px-5' onClick={() => router.replace('/')}>
        Back to app
      </Button>
    </div>
  )
}

export default NotFound
