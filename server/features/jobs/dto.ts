export interface CreateJobRequest {
  title?: string
  company?: string
  description: string
}

export interface UpdateJobStatusRequest {
  status: 'saved' | 'applied' | 'interview' | 'rejected' | 'offer'
}

export interface GenerationStatusResponse {
  status: string
  error?: string
}

export interface GenerateCvRequest {
  userAnswers?: Record<string, boolean>
  tailored?: boolean
}
