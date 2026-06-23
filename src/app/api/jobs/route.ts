import { NextResponse } from 'next/server'
import { requireUser, toErrorResponse } from '@server/lib/http'
import { listJobs, addJob, removeAllJobs } from '@server/features/jobs/service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await requireUser()
    const jobs = await listJobs(user.id)
    return NextResponse.json({ jobs })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const { title, company, description } = await req.json().catch(() => ({}))
    if (!description?.trim()) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 })
    }
    const job = await addJob(user, description, title, company)
    return NextResponse.json(job, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function DELETE() {
  try {
    const user = await requireUser()
    await removeAllJobs(user.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}
