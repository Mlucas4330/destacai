import { logger } from '@server/lib/logger'
import { AppError } from '@server/lib/errors'
import { upsertUserEmail } from '@server/features/users/repository'
import { findUserByEmail } from '@server/features/auth/repository'
import type { User } from '@server/db/schema'

const log = logger.child({ service: 'UsersService' })

export function toProfile(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    isAdmin: user.isAdmin,
    cvFileName: user.cvFileName ?? null,
    hasCv: !!user.cvR2Key,
  }
}

export async function upsertProfile(userId: string, email: string) {
  log.info({ userId, email }, 'upsertProfile')
  const existing = await findUserByEmail(email)
  if (existing && existing.id !== userId) throw new AppError('Email already in use', 409)
  const user = await upsertUserEmail(userId, email)
  log.info({ userId }, 'profile upserted')
  return toProfile(user)
}
