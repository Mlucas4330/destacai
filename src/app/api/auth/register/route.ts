import { NextResponse } from 'next/server'
import { parseJson, toErrorResponse } from '@server/lib/http'
import { RegisterSchema } from '@server/features/auth/dto'
import { createUser } from '@server/features/auth/service'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, password } = await parseJson(req, RegisterSchema)
    await createUser(email, password)
    return NextResponse.json({ message: 'Account created.', email }, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
