import { requireUser, toErrorResponse } from '@server/lib/http'
import { downloadGeneratedCv } from '@server/features/jobs/service'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const user = await requireUser()
    const { jobId } = await params
    const { buffer, fileName } = await downloadGeneratedCv(user.id, jobId, user.firstName, user.lastName)
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}
