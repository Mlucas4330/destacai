import { NextResponse } from 'next/server'
import { requireUser, toErrorResponse } from '@server/lib/http'
import { generateCvForJob } from '@server/features/jobs/service'

export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const user = await requireUser()
    const { jobId } = await params
    const body = await req.json().catch(() => ({} as { userAnswers?: Record<string, boolean>; tailored?: boolean }))
    const job = await generateCvForJob(user, jobId, body.userAnswers, body.tailored ?? true)
    return NextResponse.json(job)
  } catch (err) {
    return toErrorResponse(err)
  }
}
