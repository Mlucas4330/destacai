import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Download, Pencil, FileText, Copy, ChevronDown, MoreVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Job, JobStatus, AtsBreakdown, AtsGap } from '../types'
import { QUERY_KEYS } from '../constants'
import { useUpdateJobStatus, useDownloadCV, useGenerateCoverLetter } from '../hooks/useJobs'
import { formatDate, scoreColor } from '@/shared/utils/formatters'
import { deriveKeywords, keywordsFromBreakdown } from '@/shared/utils/keywords'
import { deriveBadges } from '@/shared/utils/badges'
import CVEditor from './CVEditor'
import ATSQuestionnaire from './ATSQuestionnaire'
import ScoreRing from './ScoreRing'
import MetricRing from './MetricRing'
import BadgeRow from './BadgeRow'

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  offer: 'Offer',
}

const STATUS_COLORS: Record<JobStatus, string> = {
  saved: 'bg-border text-navy-muted',
  applied: 'bg-accent text-accent-text',
  interview: 'bg-navy text-accent',
  rejected: 'bg-danger-surface text-danger',
  offer: 'bg-success-surface text-success-text',
}

const STATUS_BORDER: Record<JobStatus, string> = {
  saved: 'border-l-border',
  applied: 'border-l-accent',
  interview: 'border-l-navy',
  rejected: 'border-l-danger',
  offer: 'border-l-success-text',
}

interface JobItemProps {
  job: Job
  onDelete: (id: string) => void
}

const JobItem = ({ job, onDelete }: JobItemProps) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [questionnaire, setQuestionnaire] = useState<{ breakdown: AtsBreakdown; initialAnswers?: Record<string, boolean> } | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const qc = useQueryClient()
  const cacheKey = [QUERY_KEYS.JOBS, job.id, 'cover-letter']
  const [coverLetterText, setCoverLetterText] = useState<string | null>(
    () => qc.getQueryData<string>(cacheKey) ?? null,
  )
  const [showEditor, setShowEditor] = useState(false)
  const updateStatus = useUpdateJobStatus()
  const downloadCV = useDownloadCV(job.id)
  const coverLetter = useGenerateCoverLetter(job.id, (text) => {
    setCoverLetterText(text)
    qc.setQueryData(cacheKey, text)
  })
  const isGenerating = job.cvGenerationStatus === 'queued' || job.cvGenerationStatus === 'processing'
  const cvDone = job.cvGenerationStatus === 'done'
  const baseReady = job.atsStatus === 'done' && job.atsScore !== null
  const tailoredReady = job.generatedCvAtsStatus === 'done' && job.generatedCvAtsScore !== null
  const bothScoresDone = baseReady && tailoredReady

  const breakdown = job.atsBreakdown ?? null
  const tailoredBreakdown = job.generatedCvAtsBreakdown ?? null
  const gapCount = breakdown?.gaps.length ?? 0
  const useTailoredKeywords = !!tailoredBreakdown?.keywords?.length
  const derived = useTailoredKeywords ? keywordsFromBreakdown(tailoredBreakdown) : deriveKeywords(job.jdExtract, job.cvData)
  const coverage = derived.covered.length + derived.missing.length
  const badges = bothScoresDone ? deriveBadges(job, derived) : []
  const rankBadge = badges.find((b) => b.id === 'tier') ?? null
  const otherBadges = badges.filter((b) => b.id !== 'tier')

  const openReTailor = () => {
    const gaps: AtsGap[] = derived.missing.map((label) => {
      const base = breakdown?.gaps.find((g) => g.label.toLowerCase() === label.toLowerCase())
      return base ?? { label, context: 'Required skill', score_impact: 8, icon: 'wrench' }
    })
    setQuestionnaire({
      breakdown: { ...(tailoredBreakdown as AtsBreakdown), gaps },
      initialAnswers: Object.fromEntries((job.cvConfirmedSkills ?? []).map((s) => [s, true])),
    })
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className={`relative flex flex-col gap-2 p-4 rounded-xl border border-border border-l-4 ${STATUS_BORDER[job.status]} bg-bg transition-colors`}
      >
        <div className='flex items-start justify-between gap-3'>
          {job.atsScore !== null && job.atsStatus !== 'failed' ? (
            <div
              className={`shrink-0 flex flex-col items-center gap-0.5 select-none ${bothScoresDone ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              onClick={bothScoresDone ? (e) => { e.stopPropagation(); setShowBreakdown(v => !v) } : undefined}
            >
              <ScoreRing score={bothScoresDone ? job.generatedCvAtsScore! : job.atsScore} size={70} />
              {bothScoresDone && (
                <ChevronDown
                  size={12}
                  className={`text-navy-muted opacity-40 transition-transform duration-200 ${showBreakdown ? 'rotate-180' : ''}`}
                />
              )}
            </div>
          ) : (
            <div className='shrink-0 w-15' />
          )}

          <div className='flex-1 min-w-0'>
            <p className='text-base font-semibold text-navy truncate' title={job.title}>{job.title}</p>
            <p className='text-xs text-navy-muted opacity-70 mt-0.5 truncate'>{job.company} · {formatDate(job.createdAt)}</p>

            <div className='flex flex-wrap items-center gap-2 mt-1.5'>
              {job.atsStatus === 'queued' || job.atsStatus === 'processing' ? (
                <p className='text-xs text-navy-muted opacity-60'>Scoring CV...</p>
              ) : job.atsStatus === 'failed' ? (
                <p className='text-xs text-danger opacity-80'>Score failed</p>
              ) : (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowStatusMenu((v) => !v) }}
                    className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[job.status]}`}
                  >
                    {STATUS_LABELS[job.status]}
                  </button>

                  {bothScoresDone && rankBadge && <BadgeRow badges={[rankBadge]} />}

                  {baseReady && !cvDone && !isGenerating && breakdown && (
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); setQuestionnaire({ breakdown }) }}
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                      className='text-xs font-semibold text-accent hover:opacity-80 transition-opacity'
                    >
                      {gapCount > 0 ? `✦ Cover ${gapCount} more skills` : '✦ Tailor CV'}
                    </motion.button>
                  )}

                  {isGenerating && (
                    <p className='text-xs text-navy-muted opacity-60 animate-pulse'>Tailoring CV...</p>
                  )}

                  {(job.generatedCvAtsStatus === 'queued' || job.generatedCvAtsStatus === 'processing') && (
                    <p className='text-xs text-navy-muted opacity-60'>Scoring...</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className='shrink-0'>
            <button
              onClick={(e) => { e.stopPropagation(); setShowActionsMenu((v) => !v) }}
              aria-label='Actions'
              className='p-1 rounded-lg text-navy-muted hover:text-navy hover:bg-surface transition-colors cursor-pointer'
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showActionsMenu && (
            <motion.div
              key='actions'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className='overflow-hidden'
            >
              <div className='flex flex-wrap gap-1.5 rounded-xl bg-surface border border-border p-2'>
                {cvDone && (
                  <>
                    <button
                      onClick={() => {
                        if (coverLetterText) {
                          navigator.clipboard.writeText(coverLetterText)
                          toast.success('Cover letter copied!')
                        } else {
                          coverLetter.mutate()
                        }
                      }}
                      disabled={coverLetter.isPending}
                      className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium text-navy border border-border hover:bg-bg transition-colors disabled:opacity-50'
                    >
                      {coverLetterText ? <Copy size={12} /> : <FileText size={12} />}
                      {coverLetter.isPending ? 'Generating...' : coverLetterText ? 'Copy letter' : 'Cover letter'}
                    </button>
                    <button
                      onClick={() => { setShowActionsMenu(false); setShowEditor(true) }}
                      className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium text-navy border border-border hover:bg-bg transition-colors'
                    >
                      <Pencil size={12} /> Edit CV
                    </button>
                    <button
                      onClick={() => downloadCV.mutate()}
                      disabled={downloadCV.isPending}
                      className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium text-navy border border-border hover:bg-bg transition-colors disabled:opacity-50'
                    >
                      <Download size={12} /> {downloadCV.isPending ? 'Downloading...' : 'Download'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => { setShowActionsMenu(false); onDelete(job.id) }}
                  className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium text-danger border border-border hover:bg-danger-surface transition-colors'
                >
                  <Trash2 size={12} /> Delete
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
              <div className='flex flex-wrap gap-1.5 rounded-xl bg-surface border border-border p-2'>
                {(Object.keys(STATUS_LABELS) as JobStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={(e) => {
                      e.stopPropagation()
                      updateStatus.mutate({ jobId: job.id, status: s })
                      setShowStatusMenu(false)
                    }}
                    className={`text-xs px-2.5 py-0.5 rounded-md font-medium transition-opacity hover:opacity-80 ${STATUS_COLORS[s]} ${job.status === s ? 'ring-1 ring-offset-1 ring-current' : ''}`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {bothScoresDone && tailoredBreakdown && breakdown && (
          <AnimatePresence initial={false}>
            {showBreakdown && (
              <motion.div
                key='breakdown'
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className='overflow-hidden'
              >
                <div className='mt-1 rounded-xl bg-surface border border-border p-4 space-y-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='text-xs font-semibold text-navy'>CV Report Card</p>
                      <p className='text-[10px] text-navy-muted opacity-70 mt-0.5'>Overall ATS match for your tailored CV (0-100)</p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold tabular-nums cursor-help ${scoreColor(job.generatedCvAtsScore!)}`}
                      title="Overall ATS match score (0-100): how well your tailored CV fits this job. It's an overall rating, not the sum of the metrics below."
                    >
                      {job.generatedCvAtsScore}<span className='text-[10px] text-navy-muted font-medium'>/100</span>
                    </span>
                  </div>

                  <div className='space-y-1.5'>
                    <div className='grid grid-cols-3 gap-2'>
                      <MetricRing label='Skills' score={tailoredBreakdown.skills_match} hint="Skills match: how well your CV demonstrates the role's required and preferred skills. Scored 0-100." />
                      <MetricRing label='Domain' score={tailoredBreakdown.domain_fit} hint="Domain fit: alignment with the role's industry, product type, and responsibilities. Scored 0-100." />
                      <MetricRing label='Seniority' score={tailoredBreakdown.seniority_fit} hint="Seniority fit: how your experience depth and scope match the role's seniority. Scored 0-100." />
                    </div>
                    <p className='text-[10px] text-navy-muted opacity-60 text-center'>Each metric is rated 0-100 on its own; they don't add up to the total.</p>
                  </div>

                  {tailoredBreakdown.rationale && (
                    <p className='text-[11px] text-navy-muted italic border-l-2 border-navy/15 pl-2'>{tailoredBreakdown.rationale}</p>
                  )}

                  {coverage > 0 && (
                    <div className='border-t border-navy/10 pt-3 space-y-2'>
                      <div className='flex items-center justify-between'>
                        <p className='text-[10px] font-semibold text-navy-muted uppercase tracking-wide'>Keywords</p>
                        <span className='text-[10px] text-navy-muted tabular-nums'>{derived.covered.length}/{coverage}</span>
                      </div>
                      <div className='h-1.5 w-full rounded-full bg-border overflow-hidden'>
                        <motion.div
                          className='h-full rounded-full bg-success'
                          initial={{ width: 0 }}
                          animate={{ width: `${(derived.covered.length / coverage) * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                      {derived.covered.length > 0 && (
                        <div className='flex flex-wrap gap-1'>
                          {derived.covered.map((label, i) => (
                            <span key={i} className='text-xs px-2 py-0.5 rounded-md bg-success-surface text-success-text font-medium'>{label}</span>
                          ))}
                        </div>
                      )}
                      {derived.missing.length > 0 && (
                        <div className='space-y-1.5'>
                          <p className='text-[10px] font-semibold text-navy-muted uppercase tracking-wide'>Still missing</p>
                          <div className='flex flex-wrap gap-1'>
                            {derived.missing.map((label, i) => (
                              <span key={i} className='text-xs px-2 py-0.5 rounded-md bg-warn-surface text-warn font-medium'>{label}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className='border-t border-navy/10 pt-3'>
                    <button
                      onClick={(e) => { e.stopPropagation(); openReTailor() }}
                      className='w-full text-xs font-semibold text-accent border border-accent/30 rounded-lg py-2 hover:bg-accent/5 transition-colors'
                    >
                      ✦ Re-tailor CV{derived.missing.length > 0 ? ` to add ${derived.missing.length} more` : ''}
                    </button>
                  </div>

                  {tailoredBreakdown.strengths?.length > 0 && (
                    <div className='border-t border-navy/10 pt-3 space-y-1.5'>
                      <p className='text-[10px] font-semibold text-navy-muted uppercase tracking-wide'>Strengths</p>
                      <div className='flex flex-wrap gap-1'>
                        {tailoredBreakdown.strengths.map((s, i) => (
                          <span key={i} className='text-xs px-2 py-0.5 rounded-md bg-success-surface text-success-text font-medium'>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {otherBadges.length > 0 && (
                    <div className='border-t border-navy/10 pt-3 space-y-1.5'>
                      <p className='text-[10px] font-semibold text-navy-muted uppercase tracking-wide'>Badges</p>
                      <BadgeRow badges={otherBadges} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      <AnimatePresence>
        {questionnaire && (
          <ATSQuestionnaire
            jobId={job.id}
            breakdown={questionnaire.breakdown}
            initialAnswers={questionnaire.initialAnswers}
            onClose={() => setQuestionnaire(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditor && (
          <CVEditor jobId={job.id} onClose={() => setShowEditor(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

export default JobItem
