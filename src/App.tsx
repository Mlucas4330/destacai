import { useState, useEffect, useCallback } from 'react'
import { getJobs, getConfig, getPendingDescription, getAddJobDraft } from './utils/storage'
import type { Job, Config } from './types'
import MainView from './views/MainView'
import ConfigView from './views/ConfigView'
import AddJobView from './views/AddJobView'

export type View = 'main' | 'config' | 'add-job'

export default function App() {
  const [view, setView] = useState<View>('main')
  const [jobs, setJobs] = useState<Job[]>([])
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [j, c, pending, draft] = await Promise.all([
      getJobs(),
      getConfig(),
      getPendingDescription(),
      getAddJobDraft(),
    ])
    setJobs(j)
    setConfig(c)
    if (pending || (draft && (draft.description || draft.companyName || draft.jobTitle))) {
      setView('add-job')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading || !config) {
    return (
      <div className="w-100 h-120 flex flex-col items-center justify-center gap-3 bg-salmon">
        <div className="w-8 h-8 rounded-full gradient-brand animate-spin [border:3px_solid_transparent] [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,#3a10e5,#7c3aed)_border-box]" />
        <span className="text-[11px] text-darkblue/40 font-medium tracking-wide">loading…</span>
      </div>
    )
  }

  return (
    <div className="w-100 bg-transparent text-darkblue font-sans">
      {view === 'main' && (
        <MainView
          jobs={jobs}
          config={config}
          onGoToConfig={() => setView('config')}
          onAddJob={() => setView('add-job')}
          onJobsChange={setJobs}
        />
      )}
      {view === 'config' && (
        <ConfigView
          config={config}
          onConfigChange={(c: Config) => setConfig(c)}
          onBack={() => setView('main')}
        />
      )}
      {view === 'add-job' && (
        <AddJobView
          config={config}
          jobCount={jobs.length}
          onJobAdded={(job: Job) => {
            setJobs((prev) => [job, ...prev])
            setView('main')
          }}
          onBack={() => setView('main')}
        />
      )}
    </div>
  )
}
