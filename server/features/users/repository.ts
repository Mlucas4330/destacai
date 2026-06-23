import { eq } from 'drizzle-orm'
import { db } from '@server/db/client'
import { users } from '@server/db/schema'
import { logger } from '@server/lib/logger'

const log = logger.child({ repository: 'UsersRepository' })

export async function findUserById(id: string) {
  log.debug({ id }, 'findUserById')
  return db.query.users.findFirst({ where: eq(users.id, id) })
}

export async function updateUserName(id: string, firstName: string, lastName: string) {
  log.debug({ id, firstName, lastName }, 'updateUserName')
  await db.update(users).set({ firstName, lastName }).where(eq(users.id, id))
}

export async function updateUserCv(id: string, cvR2Key: string, cvFileName: string) {
  log.debug({ id, cvR2Key }, 'updateUserCv')
  await db.update(users).set({ cvR2Key, cvFileName }).where(eq(users.id, id))
}

export async function clearUserCv(id: string) {
  log.debug({ id }, 'clearUserCv')
  await db.update(users).set({ cvR2Key: null, cvFileName: null }).where(eq(users.id, id))
}

export async function upsertUserEmail(id: string, email: string) {
  log.debug({ id, email }, 'upsertUserEmail')
  const [user] = await db
    .insert(users)
    .values({ id, email })
    .onConflictDoUpdate({ target: users.id, set: { email } })
    .returning()
  return user
}
