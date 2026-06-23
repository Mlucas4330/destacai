'use client'

import { AnimatePresence } from 'framer-motion'
import JobList from '../features/jobs/components/JobList'
import NoJobState from '../features/jobs/components/NoJobState'
import NoCVState from '../features/jobs/components/NoCVState'
import { useJobs } from '../features/jobs/hooks/useJobs'
import { useHasCv } from '../features/config/hooks/useUser'

const Jobs = () => {
  const { data: jobs = [] } = useJobs()
  const hasCv = useHasCv()

  if (!hasCv) return <NoCVState />
  if (jobs.length === 0) return <NoJobState />

  return (
    <AnimatePresence mode='wait'>
      <JobList key='list' jobs={jobs} />
    </AnimatePresence>
  )
}

export default Jobs
