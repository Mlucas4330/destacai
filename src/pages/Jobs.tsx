import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import EmptyState from '@features/jobs/components/EmptyState'
import NoCvState from '@features/jobs/components/NoCvState'
import JobList from '@features/jobs/components/JobList'
import { useJobs, useDeleteJob, useClearJobs } from '@features/jobs/hooks/useJobs'
import { useUser } from '@features/config/hooks/useUser'
import { STORAGE_KEYS } from '@shared/constants'

const Jobs = () => {
  const navigate = useNavigate()
  const { data: jobs = [], isLoading } = useJobs()
  const { data: user, isLoading: isUserLoading } = useUser()
  const deleteJob = useDeleteJob()
  const clearJobs = useClearJobs()

  useEffect(() => {
    if (isUserLoading || !user?.hasCv) return

    chrome.storage.local.get(STORAGE_KEYS.PENDING_DESCRIPTION, (result: { pendingDescription?: string }) => {
      if (result.pendingDescription) navigate('/add-job')
    })

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[STORAGE_KEYS.PENDING_DESCRIPTION]?.newValue) navigate('/add-job')
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [navigate, user, isUserLoading])

  if (isLoading || isUserLoading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='w-5 h-5 border-2 border-accent rounded-full border-t-transparent animate-spin' />
      </div>
    )
  }

  if (!user?.hasCv) {
    return <NoCvState />
  }

  return (
    <AnimatePresence mode='wait'>
      {jobs.length > 0 ? (
        <JobList
          key='list'
          jobs={jobs}
          onDelete={(id) => deleteJob.mutate(id)}
          onGenerate={(id) => navigate(`/generate/${id}`)}
          onClearAll={() => clearJobs.mutate()}
        />
      ) : (
        <EmptyState key='empty' />
      )}
    </AnimatePresence>
  )
}

export default Jobs
