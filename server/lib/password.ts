import { hash, compare } from 'bcryptjs'

export function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export function comparePassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed)
}
