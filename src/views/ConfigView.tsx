import { useState, useRef } from 'react'
import type { Config, LLMProvider } from '../types'
import { saveConfig, clearAllData } from '../utils/storage'
import { ArrowLeft, Eye, EyeOff, Trash2, Upload, X, Check, Loader2 } from 'lucide-react'

interface Props {
  config: Config
  onConfigChange: (config: Config) => void
  onBack: () => void
}

const PROVIDERS: { value: LLMProvider; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'claude', label: 'Claude' },
]

const LABEL = 'text-[10px] font-bold text-darkblue/40 uppercase tracking-[0.1em]'
const INPUT =
  'w-full rounded-xl bg-white/70 border border-darkblue/8 shadow-sm text-sm text-darkblue placeholder-darkblue/25 px-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-lightblue/30 focus:ring-2 focus:ring-lightblue/8 transition-all duration-200'

export default function ConfigView({ config, onConfigChange, onBack }: Props) {
  const [form, setForm] = useState<Config>(config)
  const [showKey, setShowKey] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [resumeFileName, setResumeFileName] = useState<string | null>(
    config.resume ? 'resume (uploaded)' : null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const persist = async (updated: Config) => {
    setForm(updated)
    await saveConfig(updated)
    onConfigChange(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleProviderClick = (provider: LLMProvider) => {
    persist({ ...form, llmProvider: provider })
  }

  const handleApiKeyBlur = () => {
    persist(form)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      let text: string
      if (file.name.endsWith('.pdf')) {
        const { extractPdfText } = await import('../utils/pdf')
        text = await extractPdfText(file)
      } else {
        text = await file.text()
      }
      setResumeFileName(file.name)
      await persist({ ...form, resume: text })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveResume = async () => {
    setResumeFileName(null)
    await persist({ ...form, resume: '' })
  }

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    await clearAllData()
    const empty: Config = { resume: '', llmProvider: 'openai', apiKey: '' }
    setResumeFileName(null)
    onConfigChange(empty)
  }

  return (
    <div className="flex flex-col min-h-120">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-7 h-7 flex items-center justify-center rounded-full text-darkblue/35 hover:bg-lightblue-light hover:text-lightblue active:scale-90 transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft size={15} />
          </button>
          <span className="text-base font-bold text-gradient-brand tracking-tight">settings</span>
        </div>

        {/* Auto-saved indicator */}
        <div className={`flex items-center gap-1 text-[11px] font-medium transition-all duration-300 ${saved ? 'text-green-500 opacity-100' : 'opacity-0'}`}>
          <Check size={11} />
          saved
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 pb-4 flex-1">
        {/* Resume */}
        <div className="flex flex-col gap-2">
          <label className={LABEL}>Resume / CV</label>
          {resumeFileName ? (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/70 border border-darkblue/8 shadow-sm group">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                  <Upload size={12} className="text-white" />
                </div>
                <span className="text-sm text-darkblue font-medium truncate">{resumeFileName}</span>
              </div>
              <button
                onClick={handleRemoveResume}
                className="ml-2 w-6 h-6 flex items-center justify-center rounded-full text-darkblue/30 hover:bg-red-50 hover:text-red-500 active:scale-90 transition-all duration-200 shrink-0 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center gap-2.5 px-4 py-6 rounded-xl bg-white/50 border-2 border-dashed border-darkblue/12 text-darkblue/35 hover:border-lightblue/40 hover:bg-lightblue-light/30 hover:text-lightblue active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-lightblue-light flex items-center justify-center group-hover:bg-lightblue transition-all duration-200">
                {uploading
                  ? <Loader2 size={16} className="text-lightblue animate-spin" />
                  : <Upload size={16} className="text-lightblue group-hover:text-white transition-colors duration-200" />}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs font-semibold">{uploading ? 'Reading file…' : 'Upload your resume'}</span>
                <span className="text-[10px] opacity-60">.pdf, .txt or .md</span>
              </div>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileChange} className="hidden" />
        </div>

        {/* LLM Provider */}
        <div className="flex flex-col gap-2">
          <label className={LABEL}>LLM Provider</label>
          <div className="flex gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                onClick={() => handleProviderClick(p.value)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer active:scale-[0.97] ${
                  form.llmProvider === p.value
                    ? 'gradient-brand border-transparent text-white shadow-brand-sm'
                    : 'bg-white/70 border-darkblue/8 text-darkblue/50 hover:border-lightblue/30 hover:text-lightblue shadow-sm'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="flex flex-col gap-2">
          <label className={LABEL}>API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              onBlur={handleApiKeyBlur}
              placeholder={`Your ${PROVIDERS.find((p) => p.value === form.llmProvider)?.label} API key`}
              className={`${INPUT} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-darkblue/30 hover:bg-lightblue-light hover:text-lightblue transition-all duration-200 cursor-pointer"
            >
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center px-4 py-3 border-t border-darkblue/6">
        <button
          onClick={handleClear}
          className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border font-medium transition-all duration-200 cursor-pointer active:scale-[0.97] ${
            confirmClear
              ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
              : 'bg-white/60 border-darkblue/8 text-darkblue/40 hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm'
          }`}
        >
          <Trash2 size={12} />
          {confirmClear ? 'Confirm - this is irreversible' : 'Delete all data'}
        </button>
      </div>
    </div>
  )
}
