import { randomInt } from 'node:crypto'

/** Six-digit numeric code for email verification and password reset. */
export function generateCode(): string {
  return randomInt(100000, 1000000).toString()
}
