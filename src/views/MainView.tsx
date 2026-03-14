import { useState } from 'react'
import type { Job, Config } from '../types'
import { deleteJob } from '../utils/storage'
import { downloadCvAsPdf, previewCv } from '../utils/cv-export'
import EmptyState from '../components/EmptyState'
import { Settings, Plus, Download, Eye, Trash2, ChevronDown, Loader2 } from 'lucide-react'

interface Props {
  jobs: Job[]
  config: Config
  onGoToConfig: () => void
  onAddJob: () => void
  onJobsChange: (jobs: Job[]) => void
}

const ICON_BTN =
  'w-7 h-7 flex items-center justify-center rounded-full text-darkblue/35 hover:bg-lightblue-light hover:text-lightblue active:scale-90 transition-all duration-200 cursor-pointer'

export default function MainView({ jobs, config, onGoToConfig, onAddJob, onJobsChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (job: Job) => {
    if (!job.tailoredCv) return
    setDownloadingId(job.id)
    try {
      await downloadCvAsPdf(job.tailoredCv, job.companyName, job.jobTitle)
    } finally {
      setDownloadingId(null)
    }
  }

  const handlePreview = (job: Job) => {
    if (!job.tailoredCv) return
    previewCv(job.tailoredCv, job.companyName, job.jobTitle)
  }

  const handleDelete = async (job: Job) => {
    await deleteJob(job.id)
    onJobsChange(jobs.filter((j) => j.id !== job.id))
    if (expandedId === job.id) setExpandedId(null)
  }

  const noApiKey = !config.apiKey
  const noResume = !config.resume

  return (
    <div className="flex flex-col min-h-120">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <span className="text-base font-bold text-gradient-brand tracking-tight">destacaai</span>
        <button onClick={onGoToConfig} className={ICON_BTN} title="Settings">
          <Settings size={15} />
        </button>
      </div>

      {/* Warnings */}
      {noApiKey && (
        <div className="mx-4 mb-1 px-3.5 py-2.5 rounded-xl bg-lightblue-light border border-lightblue/20 text-lightblue text-xs font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-lightblue shrink-0" />
          <span>
            No API key.{' '}
            <button onClick={onGoToConfig} className="underline underline-offset-2 hover:opacity-70 transition-opacity cursor-pointer">
              Add it in settings.
            </button>
          </span>
        </div>
      )}
      {!noApiKey && noResume && (
        <div className="mx-4 mb-1 px-3.5 py-2.5 rounded-xl bg-white/50 border border-darkblue/8 text-darkblue/50 text-xs flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-darkblue/25 shrink-0" />
          <span>
            No CV uploaded — tailoring won't work.{' '}
            <button onClick={onGoToConfig} className="underline underline-offset-2 hover:text-darkblue transition-colors cursor-pointer">
              Add one.
            </button>
          </span>
        </div>
      )}

      {/* Content */}
      {jobs.length === 0 ? (
        <EmptyState onAddJob={onAddJob} />
      ) : (
        <div className="flex flex-col flex-1 px-4 pb-3 gap-2 overflow-y-auto max-h-105">
          {jobs.map((job) => {
            const isExpanded = expandedId === job.id
            const isDownloading = downloadingId === job.id

            return (
              <div
                key={job.id}
                className="flex flex-col rounded-xl bg-white/60 border border-darkblue/8 shadow-sm overflow-hidden"
              >
                {/* Job row */}
                <div className="flex items-center gap-1 px-2.5 py-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : job.id)}
                    className="flex-1 min-w-0 flex items-center gap-1.5 text-left"
                  >
                    <ChevronDown
                      size={13}
                      className={`shrink-0 text-darkblue/30 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                    <span className="text-sm font-semibold text-darkblue truncate">{job.companyName}</span>
                    <span className="text-darkblue/30 font-normal shrink-0">·</span>
                    <span className="text-xs text-darkblue/55 truncate">{job.jobTitle}</span>
                  </button>

                  <button
                    onClick={() => handlePreview(job)}
                    disabled={!job.tailoredCv}
                    title="Preview tailored CV"
                    className={`${ICON_BTN} disabled:opacity-25 disabled:cursor-not-allowed`}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => handleDownload(job)}
                    disabled={!job.tailoredCv || isDownloading}
                    title="Download PDF"
                    className={`${ICON_BTN} disabled:opacity-25 disabled:cursor-not-allowed`}
                  >
                    {isDownloading
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Download size={13} />}
                  </button>
                  <button
                    onClick={() => handleDelete(job)}
                    title="Delete job"
                    className="w-7 h-7 flex items-center justify-center rounded-full text-darkblue/35 hover:bg-red-50 hover:text-red-500 active:scale-90 transition-all duration-200 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Collapsible CV preview */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-darkblue/6">
                    {job.tailoredCv ? (
                      <pre className="mt-2 text-xs text-darkblue/70 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                        {job.tailoredCv}
                      </pre>
                    ) : (
                      <p className="mt-2 text-xs text-darkblue/35 italic">No tailored CV generated.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      {jobs.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-darkblue/6 mt-auto">
          <span className="text-[11px] text-darkblue/30 font-medium tabular-nums">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onAddJob}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full gradient-brand text-white text-xs font-semibold shadow-brand-sm hover:shadow-brand hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            <Plus size={12} />
            Add Job
          </button>
        </div>
      )}
    </div>
  )
}
