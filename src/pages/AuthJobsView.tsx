import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import JobList from '../features/jobs/components/JobList'
import EmptyState from '../features/jobs/components/EmptyState'
import { useAuthJobs, useAuthDeleteJob, useAuthClearJobs } from '../features/jobs/hooks/useJobs'

const AuthJobsView = () => {
  const navigate = useNavigate()
  const { data: jobs = [] } = useAuthJobs()
  const deleteJob = useAuthDeleteJob()
  const clearJobs = useAuthClearJobs()

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

export default AuthJobsView
