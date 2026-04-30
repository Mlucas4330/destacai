import { motion } from 'framer-motion'
import { Upload } from 'lucide-react'
import Button from '@/shared/components/Button'

const NoCvState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className='flex flex-col items-center justify-center gap-3 py-12 px-6 text-center'
    >
      <div className='p-3 rounded-full bg-surface'>
        <Upload size={24} className='text-navy-muted' />
      </div>
      <div>
        <p className='text-sm font-medium text-navy'>No CV uploaded</p>
        <p className='text-xs text-navy-muted mt-1'>
          Upload your CV in Settings to start saving jobs and generating tailored applications.
        </p>
      </div>
      <Button variant='primary' to='/config' className='text-xs px-4 py-1.5'>
        Go to Settings
      </Button>
    </motion.div>
  )
}

export default NoCvState
