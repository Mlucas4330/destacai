import { z } from 'zod'

const emailSchema = z.string().trim().toLowerCase().email().max(255)
const passwordSchema = z.string().min(8).max(128)
const codeSchema = z.string().regex(/^\d{6}$/, 'Code must be 6 digits')

export const RegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})
export type RegisterRequest = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
})
export type LoginRequest = z.infer<typeof LoginSchema>

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
  }
}

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
})
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>

export const ResetPasswordSchema = z.object({
  email: emailSchema,
  code: codeSchema,
  newPassword: passwordSchema,
})
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>
