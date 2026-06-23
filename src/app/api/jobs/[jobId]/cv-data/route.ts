import { NextResponse } from 'next/server'
import { requireUser, toErrorResponse } from '@server/lib/http'
import { getCvData, updateCvDataAndRegenerate } from '@server/features/jobs/service'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const user = await requireUser()
    const { jobId } = await params
    const cvData = await getCvData(user.id, jobId)
    return NextResponse.json({ cvData })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const user = await requireUser()
    const { jobId } = await params
    const body = await req.json().catch(() => ({} as { cvData?: unknown }))
    if (!body?.cvData) {
      return NextResponse.json({ error: 'cvData is required' }, { status: 400 })
    }
    const job = await updateCvDataAndRegenerate(user.id, jobId, body.cvData as never)
    return NextResponse.json(job)
  } catch (err) {
    return toErrorResponse(err)
  }
}
