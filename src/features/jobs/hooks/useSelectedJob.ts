import { useParams } from 'next/navigation'
import { useJobs } from './useJobs'
import type { Job } from '../types'

const useSelectedJob = (): Job | null => {
  const params = useParams<{ jobId?: string }>()
  const jobId = params?.jobId
  const { data: jobs } = useJobs()
  return jobs?.find((j) => j.id === jobId) ?? null
}

export default useSelectedJob
