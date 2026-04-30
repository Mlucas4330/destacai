export const STORAGE_KEYS = {
  GUEST_ID: 'destacai_guest_id',
  GUEST_JOBS: 'destacai_guest_jobs',
  GUEST_GENERATIONS_USED: 'destacai_guest_generations_used',
  GUEST_CV_R2_KEY: 'destacai_guest_cv_r2_key',
  AUTH: 'destacai_auth',
  PENDING_VERIFICATION: 'destacai_pending_verification',
  PENDING_SIGNUP: 'destacai_pending_signup',
  PENDING_DESCRIPTION: 'pendingDescription',
  PENDING_TITLE: 'pendingTitle',
  PENDING_COMPANY: 'pendingCompany',
}

export const CACHE_KEYS = {
  JOBS: 'destacai_jobs_cache',
  JOBS_TS: 'destacai_jobs_cache_ts',
  USER: 'destacai_user_cache',
  USER_TS: 'destacai_user_cache_ts',
}

export const QUERY_KEYS = {
  JOBS: 'jobs',
  USER: 'user',
  GENERATION_STATUS: 'generation-status',
  ATS_SCORE: 'ats-score',
}

export const POLLING_INTERVAL_MS = 5_000

export const FREE_TIER_LIMIT = 5
export const ADMIN_BYPASS = import.meta.env.VITE_ADMIN_BYPASS === 'true'

export const MAX_SIZE_BYTES = 10 * 1024 * 1024
export const MAX_SIZE_MB = MAX_SIZE_BYTES / (1024 * 1024)

export const BASE_URL = import.meta.env.VITE_API_URL as string
export const API_TIMEOUT = 5_000

export const QUERY_STALE_TIME = 0
export const QUERY_RETRY = 0 