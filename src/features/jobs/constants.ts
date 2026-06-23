export const STORAGE_KEYS = {
  PENDING_DESCRIPTION: 'pendingDescription',
  PENDING_TITLE: 'pendingTitle',
  PENDING_COMPANY: 'pendingCompany',
  OPEN_ADD_JOB: 'openAddJob',
} as const

export const QUERY_KEYS = {
  JOBS: 'jobs',
  GENERATION_STATUS: 'generation-status',
} as const

export const POLLING_INTERVAL_MS = 5_000
