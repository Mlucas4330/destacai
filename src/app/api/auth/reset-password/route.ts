import { NextResponse } from 'next/server'
import { parseJson, toErrorResponse } from '@server/lib/http'
import { ResetPasswordSchema } from '@server/features/auth/dto'
import { resetPassword } from '@server/features/auth/service'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await parseJson(req, ResetPasswordSchema)
    await resetPassword(email, code, newPassword)
    return NextResponse.json({ message: 'Password updated. You can now log in.' })
  } catch (err) {
    return toErrorResponse(err)
  }
}
