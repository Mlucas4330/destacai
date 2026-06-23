import { NextResponse } from 'next/server'
import { requireUser, toErrorResponse } from '@server/lib/http'
import { setJobStatus } from '@server/features/jobs/service'

export const runtime = 'nodejs'

export async function PATCH(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const user = await requireUser()
    const { jobId } = await params
    const { status } = await req.json()
    const result = await setJobStatus(user.id, jobId, status)
    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}
