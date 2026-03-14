export type LLMProvider = 'openai' | 'gemini' | 'claude'

export interface Job {
  id: string
  jobTitle: string
  companyName: string
  description: string
  tailoredCv: string
  savedAt: number
}

export interface Config {
  resume: string
  llmProvider: LLMProvider
  apiKey: string
}
