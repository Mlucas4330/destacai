import { eq } from 'drizzle-orm'
import { db } from '@server/db/client'
import { users } from '@server/db/schema'
import { logger } from '@server/lib/logger'

const log = logger.child({ repository: 'AuthRepository' })

export async function findUserByEmail(email: string) {
  log.debug({ email }, 'findUserByEmail')
  return db.query.users.findFirst({ where: eq(users.email, email) })
}

export async function saveUser(
  id: string,
  email: string,
  passwordHash: string,
  verificationCode: string,
  verificationCodeExpiresAt: Date,
) {
  log.debug({ id, email }, 'saveUser')
  await db.insert(users).values({ id, email, passwordHash, verificationCode, verificationCodeExpiresAt })
}

export async function updateUserVerification(id: string) {
  log.debug({ id }, 'updateUserVerification')
  await db.update(users).set({ emailVerified: true, verificationCode: null, verificationCodeExpiresAt: null }).where(eq(users.id, id))
}

export async function updateVerificationCode(id: string, code: string, expiresAt: Date) {
  log.debug({ id }, 'updateVerificationCode')
  await db.update(users).set({ verificationCode: code, verificationCodeExpiresAt: expiresAt }).where(eq(users.id, id))
}

export async function updateResetCode(id: string, code: string, expiresAt: Date) {
  log.debug({ id }, 'updateResetCode')
  await db.update(users).set({ resetPasswordCode: code, resetPasswordCodeExpiresAt: expiresAt }).where(eq(users.id, id))
}

export async function updatePassword(id: string, passwordHash: string) {
  log.debug({ id }, 'updatePassword')
  await db.update(users).set({ passwordHash, resetPasswordCode: null, resetPasswordCodeExpiresAt: null }).where(eq(users.id, id))
}
