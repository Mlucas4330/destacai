import { randomUUID } from 'node:crypto'
import { AppError } from '@server/lib/errors'
import { logger } from '@server/lib/logger'
import { generateCode } from '@server/lib/code'
import { hashPassword, comparePassword } from '@server/lib/password'
import { CODE_TTL_MS } from '@server/constants'
import {
  findUserByEmail,
  saveUser,
  updateResetCode,
  updatePassword,
} from '@server/features/auth/repository'
import { sendPasswordResetEmail } from '@server/features/auth/email'

const log = logger.child({ service: 'AuthService' })

export async function createUser(email: string, password: string) {
  log.info({ email }, 'createUser')
  const existing = await findUserByEmail(email)
  if (existing) throw new AppError('Email already in use', 409)

  const passwordHash = await hashPassword(password)
  const id = randomUUID()
  await saveUser(id, email, passwordHash)
  log.info({ userId: id }, 'user created')
}

/** Used by the Auth.js Credentials provider. Returns the user on success, null otherwise. */
export async function validateCredentials(email: string, password: string) {
  log.info({ email }, 'validateCredentials')
  const user = await findUserByEmail(email)
  if (!user || !user.passwordHash) return null
  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) return null
  return user
}

export async function forgotPassword(email: string) {
  log.info({ email }, 'forgotPassword')
  const user = await findUserByEmail(email)
  if (!user) {
    log.info({ email }, 'forgot password: user not found, silently ignoring')
    return
  }
  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_TTL_MS)
  await updateResetCode(user.id, code, expiresAt)
  await sendPasswordResetEmail(email, code)
  log.info({ userId: user.id }, 'password reset email sent')
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  log.info({ email }, 'resetPassword')
  const user = await findUserByEmail(email)
  if (!user) throw new AppError('User not found', 404)
  if (user.resetPasswordCode !== code) throw new AppError('Invalid code', 400)
  if (!user.resetPasswordCodeExpiresAt || user.resetPasswordCodeExpiresAt < new Date()) {
    throw new AppError('Code expired', 400)
  }
  const passwordHash = await hashPassword(newPassword)
  await updatePassword(user.id, passwordHash)
  log.info({ userId: user.id }, 'password reset success')
}
