import { motion } from 'framer-motion'
import { Briefcase, Plus } from 'lucide-react'
import Button from '@/shared/components/Button'
import { useUiStore } from '@/shared/stores/ui'

const NoJobState = () => {
  const openDrawer = useUiStore((s) => s.openDrawer)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className='flex flex-col items-center justify-center gap-4 py-20 px-6 text-center'
    >
      <div className='p-4 rounded-full bg-canvas border border-border'>
        <Briefcase size={28} className='text-navy-muted' />
      </div>
      <div>
        <p className='text-lg font-semibold text-navy'>No saved jobs yet</p>
        <p className='text-sm text-navy-muted mt-1.5'>
          Add a job and paste its description to tailor your CV.
        </p>
      </div>
      <Button
        variant='primary'
        className='inline-flex items-center gap-1.5 px-5'
        onClick={() => openDrawer('add-job')}
      >
        Add a job <Plus size={16} />
      </Button>
    </motion.div>
  )
}

export default NoJobState
