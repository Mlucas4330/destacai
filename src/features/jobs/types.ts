export type JobStatus = 'saved' | 'applied' | 'interview' | 'rejected' | 'offer'

export interface AtsGap {
  label: string
  context: string
  score_impact: number
  icon: string
}

export interface AtsKeyword {
  label: string
  required: boolean
  present: boolean
}

export interface AtsBreakdown {
  skills_match: number
  domain_fit: number
  seniority_fit: number
  rationale?: string
  strengths: string[]
  gaps: AtsGap[]
  keywords?: AtsKeyword[]
}

export interface CVEntry {
  org: string
  role: string
  location: string
  dates: string
  bullets: string[]
}

export interface CVEducation {
  university: string
  degree: string
  location: string
  dates: string
}

export interface CVData {
  name: string
  email: string
  linkedin: string
  github: string
  leadership: CVEntry[]
  experience: CVEntry[]
  skills: { technical: string; languages: string }
  education: CVEducation[]
}

export interface JDExtract {
  title: string
  company: string
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
  senioritySignals: string
  qualifications: string[]
}
export type ProcessingStatus = 'idle' | 'queued' | 'processing' | 'done' | 'failed'

export interface Job {
  id: string
  userId: string
  title: string
  company: string
  description: string
  status: JobStatus
  atsStatus: ProcessingStatus
  atsScore: number | null
  atsExplanation: string | null
  atsBreakdown: AtsBreakdown | null
  cvGenerationStatus: ProcessingStatus
  cvGenerationError: string | null
  cvR2Key: string | null
  createdAt: string
  generatedCvAtsStatus: ProcessingStatus
  generatedCvAtsScore: number | null
  generatedCvAtsExplanation: string | null
  generatedCvAtsBreakdown: AtsBreakdown | null
  cvData: CVData | null
  jdExtract: JDExtract | null
  cvConfirmedSkills: string[] | null
}

export interface JobListProps {
  jobs: Job[]
}
