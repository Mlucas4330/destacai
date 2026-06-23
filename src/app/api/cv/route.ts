import { NextResponse } from 'next/server'
import { requireUser, toErrorResponse } from '@server/lib/http'
import { deleteCv } from '@server/features/cv/service'

export const runtime = 'nodejs'

export async function DELETE() {
  try {
    const user = await requireUser()
    await deleteCv(user.id)
    return NextResponse.json({ message: 'CV deleted' })
  } catch (err) {
    return toErrorResponse(err)
  }
}
