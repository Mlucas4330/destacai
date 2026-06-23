import { requireUser, toErrorResponse } from '@server/lib/http'
import { generateCoverLetter } from '@server/features/jobs/service'

export const runtime = 'nodejs'

export async function POST(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const user = await requireUser()
    const { jobId } = await params
    const text = await generateCoverLetter(user.id, jobId)
    return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (err) {
    return toErrorResponse(err)
  }
}
