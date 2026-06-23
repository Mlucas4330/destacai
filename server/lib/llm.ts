import { createOpenAI } from '@ai-sdk/openai'

const openaiClient = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export function getGenerationModel() {
  return openaiClient('gpt-4o-2024-11-20')
}

export function getLightweightModel() {
  return openaiClient('gpt-4o-mini-2024-07-18')
}
