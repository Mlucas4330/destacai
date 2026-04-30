import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import JobList from './JobList'
import EmptyState from './EmptyState'
import { useGuestJobs, useGuestDeleteJob, useGuestClearJobs } from '../hooks/useJobs'

const GuestJobsView = () => {
  const navigate = useNavigate()
  const { data: jobs = [] } = useGuestJobs()
  const deleteJob = useGuestDeleteJob()
  const clearJobs = useGuestClearJobs()

  if (jobs.length === 0) return <EmptyState />

  return (
    <AnimatePresence mode='wait'>
      <JobList
        key='list'
        jobs={jobs}
        onDelete={(id) => deleteJob.mutate(id)}
        onGenerate={(id) => navigate(`/generate/${id}`)}
        onClearAll={() => clearJobs.mutate()}
      />
    </AnimatePresence>
  )
}

export default GuestJobsView
