import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

// Right-side slide-in panel used for secondary flows (Add job, Settings) over the
// main job list. Content is only mounted while open, but stays mounted through the
// exit animation so the panel slides out with its content intact.
const Drawer = ({ open, onClose, title, children }: DrawerProps) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className='fixed inset-0 z-50'>
          <motion.div
            className='absolute inset-0 bg-navy/30'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className='absolute top-0 right-0 h-full w-full max-w-md bg-canvas border-l border-border shadow-2xl flex flex-col'
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            role='dialog'
            aria-label={title}
          >
            <header className='flex items-center justify-between px-6 py-4 border-b border-border shrink-0'>
              <h2 className='text-lg font-semibold text-navy'>{title}</h2>
              <button
                type='button'
                onClick={onClose}
                aria-label='Close'
                className='p-1.5 rounded-lg text-navy-muted hover:text-navy hover:bg-surface transition-colors cursor-pointer'
              >
                <X size={20} />
              </button>
            </header>
            <div className='flex-1 overflow-y-auto px-6 py-6'>
              {children}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Drawer
