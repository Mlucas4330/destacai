import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@lib/api'
import { useGenerateCV, useGenerationStatus } from '../hooks/useGenerateCV'
import useSelectedJob from '../hooks/useSelectedJob'

const GenerateCV = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const job = useSelectedJob()
  const [isPolling, setIsPolling] = useState(false)
  const ran = useRef(false)

  const { mutate: generate } = useGenerateCV()
  const { data: statusData } = useGenerationStatus(job?.id ?? '', isPolling)

  useEffect(() => {
    if (!job || ran.current) return
    ran.current = true

    generate(job.id, {
      onSuccess: () => setIsPolling(true),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 402) {
          toast.error('Free tier limit reached. Upgrade to continue generating CVs.')
        } else if (err instanceof ApiError && err.status === 400) {
          toast.error('No CV uploaded. Please upload your CV in Settings.')
        } else {
          toast.error('Failed to queue CV generation. Please try again.')
        }
        navigate('/')
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job])

  useEffect(() => {
    if (!statusData) return
    if (statusData.status === 'done') {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      navigate('/')
    }
    if (statusData.status === 'failed') {
      toast.error(statusData.error ?? 'CV generation failed. Please try again.')
      navigate('/')
    }
  }, [statusData, navigate, queryClient])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className='flex flex-col items-center justify-center gap-3 py-12 px-6 text-center h-full'
    >
      <RefreshCw size={20} className='text-accent-text animate-spin' />
      <p className='text-sm text-navy'>Generating your custom CV...</p>
      <p className='text-xs text-navy-muted'>This may take up to 2 minutes.</p>
    </motion.div>
  )
}

export default GenerateCV
