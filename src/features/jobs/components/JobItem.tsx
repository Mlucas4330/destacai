import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X } from 'lucide-react'
import { useAuthContext } from '@/features/auth/stores/auth'
import { useGuestContext } from '@/features/auth/stores/GuestContext'
import { BASE_URL } from '@/lib/api.client'
import type { Job, JobStatus } from '@/shared/types'
import Button from '@/shared/components/Button'
import IconButton from '@/shared/components/IconButton'
import toast from 'react-hot-toast'
import { useUpdateJobStatus } from '../hooks/useJobs'
import { useGenerationStatus } from '../hooks/useGenerateCV'
import { useAtsScore } from '../hooks/useAtsScore'

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  offer: 'Offer',
}

const STATUS_COLORS: Record<JobStatus, string> = {
  saved: 'bg-border text-navy-muted',
  applied: 'bg-accent text-navy',
  interview: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-700',
  offer: 'bg-green-100 text-green-700',
}

const STATUS_BORDER: Record<JobStatus, string> = {
  saved: 'border-l-gray-300',
  applied: 'border-l-accent',
  interview: 'border-l-blue-400',
  rejected: 'border-l-red-400',
  offer: 'border-l-green-400',
}

const formatDate = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

const scoreColor = (score: number) =>
  score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'

interface JobItemProps {
  job: Job
  onDelete: (id: string) => void
  onGenerate: (id: string) => void
}

const JobItem = ({ job, onDelete, onGenerate }: JobItemProps) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [expandedUploaded, setExpandedUploaded] = useState(false)
  const [expandedGenerated, setExpandedGenerated] = useState(false)
  const updateStatus = useUpdateJobStatus()
  const { getToken, isSignedIn } = useAuthContext()
  const { updateGuestJob, guestId } = useGuestContext()

  const isGenerating = job.cvGenerationStatus === 'queued' || job.cvGenerationStatus === 'processing'
  const { data: genStatus } = useGenerationStatus(job.id, isGenerating)


  const isAtsPolling = job.generatedCvAtsStatus === 'queued' || job.generatedCvAtsStatus === 'processing'
  const { data: atsData } = useAtsScore(
    job.id,
    isAtsPolling || (!isSignedIn && job.cvGenerationStatus === 'done' && (job.generatedCvAtsStatus !== 'done' || job.atsStatus !== 'done')),
  )

  useEffect(() => {
    if (isSignedIn || !atsData) return
    if (atsData.generated.status === 'done' || atsData.generated.status === 'failed') {
      updateGuestJob(job.id, {
        generatedCvAtsStatus: atsData.generated.status,
        generatedCvAtsScore: atsData.generated.score,
        generatedCvAtsExplanation: atsData.generated.explanation,
      })
    }
    if (atsData.uploaded.status === 'done' || atsData.uploaded.status === 'failed') {
      updateGuestJob(job.id, {
        atsStatus: atsData.uploaded.status,
        atsScore: atsData.uploaded.score,
        atsExplanation: atsData.uploaded.explanation,
      })
    }
  }, [atsData, isSignedIn, job.id, updateGuestJob])

  const displayUploadedAtsStatus = atsData?.uploaded.status ?? job.atsStatus
  const displayUploadedAtsScore = atsData?.uploaded.score ?? job.atsScore
  const displayUploadedAtsExplanation = atsData?.uploaded.explanation ?? job.atsExplanation
  const displayGeneratedAtsStatus = atsData?.generated.status ?? job.generatedCvAtsStatus
  const displayGeneratedAtsScore = atsData?.generated.score ?? job.generatedCvAtsScore
  const displayGeneratedAtsExplanation = atsData?.generated.explanation ?? job.generatedCvAtsExplanation

  const handleDownload = async () => {
    try {
      let res: Response
      if (!isSignedIn) {
        res = await fetch(`${BASE_URL}/guest/generate/${job.id}/download?guestId=${encodeURIComponent(guestId)}`)
      } else {
        const token = await getToken()
        res = await fetch(
          `${import.meta.env.VITE_API_URL}/generate/${job.id}/download`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
      }
      if (!res.ok) throw new Error('Download failed')
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="([^"]+)"/)
      const fileName = match?.[1] ?? 'cv.pdf'
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      toast.error('Failed to download CV. Please try again.')
    }
  }

  const cvDone = job.cvGenerationStatus === 'done' || genStatus?.status === 'done'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      onClick={() => setShowStatusMenu((v) => !v)}
      className={`relative cursor-pointer flex flex-col gap-2 p-3 rounded-xl border border-border border-l-4 ${STATUS_BORDER[job.status]} bg-bg transition-colors`}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium text-navy truncate' title={job.title}>
            {job.title}
          </p>
          <p className='text-xs text-navy-muted opacity-70 mt-0.5'>
            {job.company} · {formatDate(job.createdAt)}
          </p>

          <div className='flex items-center gap-3 mt-1.5'>
            {displayUploadedAtsStatus === 'queued' || displayUploadedAtsStatus === 'processing' ? (
              <p className='text-xs text-navy-muted opacity-60'>Base scoring...</p>
            ) : displayUploadedAtsStatus === 'done' && displayUploadedAtsScore !== null ? (
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedUploaded((v) => !v) }}
                className='text-xs font-medium text-navy-muted hover:opacity-80 transition-opacity'
              >
                Base: <span className={scoreColor(displayUploadedAtsScore)}>{displayUploadedAtsScore}/100</span>
              </button>
            ) : displayUploadedAtsStatus === 'failed' ? (
              <p className='text-xs text-red-400 opacity-80'>Base score failed</p>
            ) : null}

            {displayGeneratedAtsStatus === 'queued' || displayGeneratedAtsStatus === 'processing' ? (
              <p className='text-xs text-navy-muted opacity-60'>Tailored scoring...</p>
            ) : displayGeneratedAtsStatus === 'done' && displayGeneratedAtsScore !== null ? (
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedGenerated((v) => !v) }}
                className='text-xs font-medium text-navy-muted hover:opacity-80 transition-opacity'
              >
                Tailored: <span className={scoreColor(displayGeneratedAtsScore)}>{displayGeneratedAtsScore}/100</span>
              </button>
            ) : displayGeneratedAtsStatus === 'failed' ? (
              <p className='text-xs text-red-400 opacity-80'>Tailored failed</p>
            ) : null}
          </div>

          <span className={`inline-flex mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[job.status]}`}>
            {STATUS_LABELS[job.status]}
          </span>
        </div>

        <div className='flex items-center gap-1 shrink-0' onClick={(e) => e.stopPropagation()}>
          {cvDone ? (
            <Button variant='primary' onClick={handleDownload} className='text-xs px-3 py-1.5'>
              Download CV
            </Button>
          ) : isGenerating ? (
            <Button variant='secondary' disabled className='text-xs px-3 py-1.5 opacity-60'>
              Generating...
            </Button>
          ) : (
            <Button variant='primary' onClick={() => onGenerate(job.id)} className='text-xs px-3 py-1.5'>
              Generate CV
            </Button>
          )}
          <IconButton
            icon={Trash2}
            label='Delete job'
            variant='danger'
            onClick={() => onDelete(job.id)}
          />
        </div>
      </div>

      <AnimatePresence>
        {expandedUploaded && displayUploadedAtsExplanation && (
          <motion.div
            key='uploaded'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className='overflow-hidden'
          >
            <div className='relative text-xs text-navy-muted bg-surface border border-border rounded-lg p-2 pr-6 leading-relaxed'>
              <span className='font-medium text-navy'>Base: </span>{displayUploadedAtsExplanation}
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedUploaded(false) }}
                className='absolute top-1.5 right-1.5 text-navy-muted hover:text-navy transition-colors'
                aria-label='Close explanation'
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
        {expandedGenerated && displayGeneratedAtsExplanation && (
          <motion.div
            key='generated'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className='overflow-hidden'
          >
            <div className='relative text-xs text-navy-muted bg-surface border border-border rounded-lg p-2 pr-6 leading-relaxed'>
              <span className='font-medium text-navy'>Tailored: </span>{displayGeneratedAtsExplanation}
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedGenerated(false) }}
                className='absolute top-1.5 right-1.5 text-navy-muted hover:text-navy transition-colors'
                aria-label='Close explanation'
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStatusMenu && (
          <motion.div
            key='status'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className='overflow-hidden'
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className='flex flex-wrap gap-1.5 bg-surface border border-border rounded-lg p-2'
            >
              {(Object.keys(STATUS_LABELS) as JobStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    updateStatus.mutate({ jobId: job.id, status: s })
                    setShowStatusMenu(false)
                  }}
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-opacity hover:opacity-80 ${STATUS_COLORS[s]} ${job.status === s ? 'ring-1 ring-offset-1 ring-current' : ''}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default JobItem
