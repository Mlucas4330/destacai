import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import JobItem from './JobItem'
import { useStatusHint } from '../hooks/useStatusHint'
import { useDeleteJob, useClearJobs } from '../hooks/useJobs'
import type { JobListProps } from '../types'

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

const JobList = ({ jobs }: JobListProps) => {
  const { showHint, dismissHint } = useStatusHint()
  const deleteJob = useDeleteJob()
  const clearJobs = useClearJobs()

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-navy-muted'>{jobs.length} job{jobs.length !== 1 ? 's' : ''} saved</p>
        <motion.button
          type='button'
          onClick={() => clearJobs.mutate()}
          whileTap={{ scale: 0.95 }}
          className='text-sm text-navy-muted hover:text-danger transition-colors cursor-pointer'
        >
          Clear all
        </motion.button>
      </div>

      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className='overflow-hidden'
          >
            <div className='flex items-center justify-between gap-2 text-xs text-navy-muted bg-surface border border-border rounded-lg px-3 py-2 mb-1'>
              <span>Tip: click a card to change its status</span>
              <button onClick={dismissHint} className='hover:text-navy transition-colors shrink-0'>
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className='flex flex-col gap-2'
        variants={listVariants}
        initial='hidden'
        animate='visible'
      >
        <AnimatePresence initial={false}>
          {jobs.map((job) => (
            <JobItem key={job.id} job={job} onDelete={(id) => deleteJob.mutate(id)} />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default JobList
