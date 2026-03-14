import type { Config } from '../types'

async function callOpenAI(
  apiKey: string,
  messages: { role: string; content: string }[],
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.8 }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `OpenAI error ${res.status}`)
  }
  const data = await res.json()
  return data.choices[0].message.content as string
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8 },
      }),
    },
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`)
  }
  const data = await res.json()
  return data.candidates[0].content.parts[0].text as string
}

async function callClaude(
  apiKey: string,
  messages: { role: string; content: string }[],
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0.8,
      messages,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Claude error ${res.status}`)
  }
  const data = await res.json()
  return data.content[0].text as string
}

async function callLLM(config: Config, system: string, user: string): Promise<string> {
  const { llmProvider, apiKey } = config
  switch (llmProvider) {
    case 'openai':
      return callOpenAI(apiKey, [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ])
    case 'gemini':
      return callGemini(apiKey, `${system}\n\n${user}`)
    case 'claude':
      return callClaude(apiKey, [{ role: 'user', content: `${system}\n\n${user}` }])
  }
}

export async function extractJobInfo(
  config: Config,
  description: string,
): Promise<{ companyName: string | null; jobTitle: string | null }> {
  const system = `Extract the company name and job title from the job description.
Return ONLY valid JSON with this exact shape: {"companyName": "...", "jobTitle": "..."}
Use null for any field you cannot determine. No markdown, no explanation.`

  try {
    const raw = await callLLM(config, system, description)
    const cleaned = raw.replace(/```json\n?|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      companyName: parsed.companyName ?? null,
      jobTitle: parsed.jobTitle ?? null,
    }
  } catch {
    return { companyName: null, jobTitle: null }
  }
}

export async function generateHighlight(
  config: Config,
  description: string,
  companyName: string,
  jobTitle: string,
): Promise<string> {
  const resume = config.resume ?? ''

  const system = `You are a CV tailoring assistant. Rewrite the candidate's CV to emphasize what is most relevant for the target job. Output a complete, ready-to-use CV — not a summary.

Rules:
- Detect the language of the job description and write the entire CV in that same language
- Keep all sections from the original CV (experience, education, skills, etc.) — do NOT remove sections
- Reorder bullet points within each role so the most relevant ones come first
- Rephrase bullets to use terminology from the job description where it genuinely matches — do NOT invent experience that is not in the original CV; only reframe what is already there
- Add a short 2–3 line professional summary at the top that connects the candidate's background to the ${jobTitle} role at ${companyName}
- Output in clean markdown:
  - # Full Name
  - ## Section headers (Experience, Education, Skills, etc.)
  - ### Role | Company | Dates
  - - bullet points
- No commentary, no explanations outside the CV content itself

Original CV:
${resume}`

  const user = `Target role: ${jobTitle} at ${companyName}\n\nJob description:\n${description}`

  return callLLM(config, system, user)
}