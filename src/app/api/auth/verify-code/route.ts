import { NextResponse } from 'next/server'
import { parseJson, toErrorResponse } from '@server/lib/http'
import { VerifyCodeSchema } from '@server/features/auth/dto'
import { verifyCode } from '@server/features/auth/service'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, code } = await parseJson(req, VerifyCodeSchema)
    await verifyCode(email, code)
    return NextResponse.json({ message: 'Email verified. You can now sign in.' })
  } catch (err) {
    return toErrorResponse(err)
  }
}
