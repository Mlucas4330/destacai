import { NextResponse } from 'next/server'
import { parseJson, toErrorResponse } from '@server/lib/http'
import { ForgotPasswordSchema } from '@server/features/auth/dto'
import { forgotPassword } from '@server/features/auth/service'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email } = await parseJson(req, ForgotPasswordSchema)
    await forgotPassword(email)
    return NextResponse.json({ message: 'If that email is registered, a code was sent.' })
  } catch (err) {
    return toErrorResponse(err)
  }
}
