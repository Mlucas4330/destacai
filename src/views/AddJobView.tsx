import { useState, useEffect, useRef } from 'react'
import type { Job, Config } from '../types'
import { saveJob, saveAddJobDraft, clearAddJobDraft, getPendingDescription, clearPendingDescription } from '../utils/storage'
import { generateHighlight, extractJobInfo } from '../utils/llm'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'

interface Props {
  config: Config
  jobCount: number
  onJobAdded: (job: Job) => void
  onBack: () => void
}

type Step = 'form' | 'processing' | 'preview'

const LABEL = 'text-[10px] font-bold text-darkblue/40 uppercase tracking-[0.1em]'
const INPUT =
  'w-full rounded-xl bg-white/70 border border-darkblue/8 shadow-sm text-sm text-darkblue placeholder-darkblue/25 px-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-lightblue/30 focus:ring-2 focus:ring-lightblue/8 transition-all duration-200'

export default function AddJobView({ config, jobCount, onJobAdded, onBack }: Props) {
  const [step, setStep] = useState<Step>('form')
  const [description, setDescription] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [tailoredCv, setTailoredCv] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const initialized = useRef(false)

  const MAX_JOBS = 50

  // On mount: restore from pending (right-click) or draft
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      const pending = await getPendingDescription()
      if (pending) {
        setDescription(pending)
        await clearPendingDescription()
        if (config.apiKey) {
          setExtracting(true)
          try {
            const info = await extractJobInfo(config, pending)
            if (info.companyName) setCompanyName(info.companyName)
            if (info.jobTitle) setJobTitle(info.jobTitle)
          } finally {
            setExtracting(false)
          }
        }
        return
      }

      const draft = await import('../utils/storage').then((m) => m.getAddJobDraft())
      if (draft) {
        setDescription(draft.description)
        setCompanyName(draft.companyName)
        setJobTitle(draft.jobTitle)
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save draft on every form field change
  useEffect(() => {
    if (step === 'form') {
      saveAddJobDraft({ description, companyName, jobTitle })
    }
  }, [description, companyName, jobTitle, step])

  const handleProcess = async () => {
    if (!description.trim() || !companyName.trim() || !jobTitle.trim()) return
    if (jobCount >= MAX_JOBS) {
      setError(`You've reached the ${MAX_JOBS}-job limit. Delete a job to add a new one.`)
      return
    }
    if (!config.apiKey) {
      setError('Please add your API key in settings before generating.')
      return
    }

    setError(null)
    setStep('processing')

    try {
      const msg = await generateHighlight(config, description, companyName.trim(), jobTitle.trim())
      setTailoredCv(msg)
      setStep('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate tailored CV')
      setStep('form')
    }
  }

  const handleSave = async () => {
    const job: Job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      description,
      tailoredCv,
      savedAt: Date.now(),
    }
    const result = await saveJob(job)
    if (result.limitReached) {
      setError(`You've reached the ${MAX_JOBS}-job limit.`)
      return
    }
    await clearAddJobDraft()
    onJobAdded(job)
  }

  const handleBack = async () => {
    await clearAddJobDraft()
    onBack()
  }

  const allFilled = description.trim() && companyName.trim() && jobTitle.trim()

  return (
    <div className="flex flex-col min-h-120">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <button
          onClick={handleBack}
          disabled={step === 'processing'}
          className="w-7 h-7 flex items-center justify-center rounded-full text-darkblue/35 hover:bg-lightblue-light hover:text-lightblue disabled:opacity-30 active:scale-90 transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft size={15} />
        </button>
        <span className="text-base font-bold text-gradient-brand tracking-tight">add job</span>
      </div>

      {step === 'processing' ? (
        <div className="flex flex-col flex-1 items-center justify-center gap-4 px-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-full gradient-brand opacity-20 animate-ping absolute inset-0" />
            <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center shadow-brand relative">
              <Sparkles size={22} className="text-white animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-semibold text-darkblue">Tailoring your CV</p>
            <p className="text-xs text-darkblue/40">Matching your profile to the job…</p>
          </div>
        </div>
      ) : step === 'form' ? (
        <div className="flex flex-col flex-1 px-4 pb-3 gap-4">
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={LABEL}>
                Company <span className="text-red-400 normal-case font-normal">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  disabled={extracting}
                  className={`${INPUT} ${extracting ? 'opacity-50' : ''}`}
                />
                {extracting && (
                  <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-lightblue animate-spin" />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={LABEL}>
                Job Title <span className="text-red-400 normal-case font-normal">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Frontend Engineer"
                  disabled={extracting}
                  className={`${INPUT} ${extracting ? 'opacity-50' : ''}`}
                />
                {extracting && (
                  <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-lightblue animate-spin" />
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={LABEL}>
              Job Description <span className="text-red-400 normal-case font-normal">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={10}
              placeholder="Paste the full job description here…"
              className="w-full resize-none rounded-xl bg-white/70 border border-darkblue/8 shadow-sm text-sm text-darkblue placeholder-darkblue/25 px-3.5 py-3 focus:outline-none focus:bg-white focus:border-lightblue/30 focus:ring-2 focus:ring-lightblue/8 transition-all duration-200"
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg -mt-2">{error}</p>
          )}
        </div>
      ) : (
        /* preview */
        <div className="flex flex-col flex-1 px-4 pb-3 gap-4">
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={LABEL}>Company</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={INPUT} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={LABEL}>Job Title</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={INPUT} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center justify-between">
              <label className={LABEL}>Tailored CV Preview</label>
              <span className="text-[10px] text-darkblue/30 font-medium">Edit before saving</span>
            </div>
            <textarea
              value={tailoredCv}
              onChange={(e) => setTailoredCv(e.target.value)}
              rows={10}
              className="w-full resize-none rounded-xl bg-white/70 border border-darkblue/8 shadow-sm text-sm text-darkblue px-3.5 py-3 focus:outline-none focus:bg-white focus:border-lightblue/30 focus:ring-2 focus:ring-lightblue/8 transition-all duration-200"
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg -mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Footer */}
      {step !== 'processing' && (
        <div className="px-4 py-3 border-t border-darkblue/6">
          {step === 'form' ? (
            <button
              onClick={handleProcess}
              disabled={!allFilled}
              className="w-full py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-brand-sm hover:shadow-brand hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-brand-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              Generate Highlight
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!companyName.trim() || !jobTitle.trim()}
              className="w-full py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-brand-sm hover:shadow-brand hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              Save Job
            </button>
          )}
        </div>
      )}
    </div>
  )
}
