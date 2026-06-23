'use client'

import { useRouter } from 'next/navigation'
import { Plus, Settings } from 'lucide-react'
import { useUiStore } from '@/shared/stores/ui'
import Button from '@/shared/components/Button'

// Full-width app header: brand on the left; "Add job" and a settings button on
// the right. Add job / Settings open as drawers.
const TopBar = () => {
  const router = useRouter()
  const openDrawer = useUiStore((s) => s.openDrawer)

  return (
    <header className='sticky top-0 z-40 bg-canvas/90 backdrop-blur-sm border-b border-border'>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3'>
        <button
          type='button'
          onClick={() => router.push('/')}
          className='flex items-center gap-2 cursor-pointer'
          aria-label='DestacAI home'
        >
          <img src='/icon.png' alt='' className='w-7 h-7' />
          <span className='text-lg font-semibold text-navy'>DestacAI</span>
        </button>

        <div className='flex items-center gap-2 sm:gap-3'>
          <Button onClick={() => openDrawer('add-job')} className='inline-flex items-center gap-1.5'>
            <Plus size={16} /> Add job
          </Button>

          <button
            type='button'
            onClick={() => openDrawer('config')}
            aria-label='Settings'
            title='Settings'
            className='p-2 rounded-xl text-navy-muted hover:text-navy hover:bg-surface transition-colors cursor-pointer'
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopBar
