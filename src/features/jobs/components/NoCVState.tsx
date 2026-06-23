import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import Button from '@/shared/components/Button'
import { useUiStore } from '@/shared/stores/ui'

const NoCVState = () => {
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
        <FileText size={28} className='text-navy-muted' />
      </div>
      <div>
        <p className='text-lg font-semibold text-navy'>No CV uploaded yet</p>
        <p className='text-sm text-navy-muted mt-1.5'>Upload your CV to start generating tailored applications.</p>
      </div>
      <Button variant='primary' className='px-5' onClick={() => openDrawer('config')}>
        Upload CV
      </Button>
    </motion.div>
  )
}

export default NoCVState
