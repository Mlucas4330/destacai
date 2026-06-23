import { NextResponse } from 'next/server'
import type { z } from 'zod'
import { auth } from '@server/auth'
import { AppError } from '@server/lib/errors'
import { logger } from '@server/lib/logger'
import { findUserById } from '@server/features/users/repository'
import type { User } from '@server/db/schema'

/** Parse and validate a JSON request body against a Zod schema, or throw a 400. */
export async function parseJson<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  const json = await req.json().catch(() => null)
  const result = schema.safeParse(json)
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
    throw new AppError('Invalid request', 400, { issues })
  }
  return result.data
}

/** Resolve the authenticated user for an API route, or throw a 401 AppError. */
export async function requireUser(): Promise<User> {
  const session = await auth()
  if (!session?.user?.id) throw new AppError('Unauthorized', 401)
  const user = await findUserById(session.user.id)
  if (!user) throw new AppError('Unauthorized', 401)
  return user
}

/** Translate a thrown error into a JSON response (mirrors the old Hono onError). */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof AppError) {
    logger.warn({ statusCode: err.statusCode, message: err.message }, 'handled error')
    return NextResponse.json({ error: err.message, ...(err.data ?? {}) }, { status: err.statusCode })
  }
  logger.error({ err }, 'unhandled route error')
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
