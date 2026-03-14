import type { Job, Config } from '../types'

const MAX_JOBS = 50
const JOB_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000

export const defaultConfig: Config = {
  resume: '',
  llmProvider: 'openai',
  apiKey: '',
}

function purgeExpired(jobs: Job[]): Job[] {
  const cutoff = Date.now() - JOB_EXPIRY_MS
  return jobs.filter((j) => j.savedAt > cutoff)
}

export async function getJobs(): Promise<Job[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get('jobs', (result: { jobs?: Job[] }) => {
      const jobs: Job[] = result.jobs ?? []
      const valid = purgeExpired(jobs)
      // Persist cleaned list if anything was removed
      if (valid.length !== jobs.length) {
        chrome.storage.local.set({ jobs: valid })
      }
      resolve(valid)
    })
  })
}

export async function saveJob(job: Job): Promise<{ limitReached: boolean }> {
  const jobs = await getJobs()
  const existingIdx = jobs.findIndex((j) => j.id === job.id)

  if (existingIdx >= 0) {
    jobs[existingIdx] = job
  } else {
    if (jobs.length >= MAX_JOBS) {
      return { limitReached: true }
    }
    jobs.unshift(job)
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ jobs }, () => resolve({ limitReached: false }))
  })
}

export async function updateJobTailoredCv(id: string, tailoredCv: string): Promise<void> {
  const jobs = await getJobs()
  const job = jobs.find((j) => j.id === id)
  if (!job) return
  job.tailoredCv = tailoredCv
  return new Promise((resolve) => {
    chrome.storage.local.set({ jobs }, resolve)
  })
}

export async function deleteJob(id: string): Promise<void> {
  const jobs = await getJobs()
  const filtered = jobs.filter((j) => j.id !== id)
  return new Promise((resolve) => {
    chrome.storage.local.set({ jobs: filtered }, resolve)
  })
}

export async function getConfig(): Promise<Config> {
  return new Promise((resolve) => {
    chrome.storage.local.get('config', (result) => {
      resolve((result['config'] as Config | undefined) ?? defaultConfig)
    })
  })
}

export async function saveConfig(config: Config): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ config }, resolve)
  })
}

export async function clearAllData(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.clear(resolve)
  })
}

export async function getPendingDescription(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get('pendingDescription', (result) => {
      resolve((result['pendingDescription'] as string | undefined) ?? null)
    })
  })
}

export async function clearPendingDescription(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove('pendingDescription', resolve)
  })
}

export interface AddJobDraft {
  description: string
  companyName: string
  jobTitle: string
}

export function saveAddJobDraft(draft: AddJobDraft): void {
  chrome.storage.local.set({ addJobDraft: draft })
}

export async function getAddJobDraft(): Promise<AddJobDraft | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get('addJobDraft', (result) => {
      resolve((result['addJobDraft'] as AddJobDraft | undefined) ?? null)
    })
  })
}

export async function clearAddJobDraft(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove('addJobDraft', resolve)
  })
}
