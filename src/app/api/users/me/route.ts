import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, parseJson, toErrorResponse } from '@server/lib/http'
import { toProfile, upsertProfile } from '@server/features/users/service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await requireUser()
    return NextResponse.json(toProfile(user))
  } catch (err) {
    return toErrorResponse(err)
  }
}

const UpdateProfileSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
})

export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const { email } = await parseJson(req, UpdateProfileSchema)
    const profile = await upsertProfile(user.id, email)
    return NextResponse.json(profile)
  } catch (err) {
    return toErrorResponse(err)
  }
}
