import { apiClient } from '@/lib/apiClient'
import type { SignUpResponse, ResetPasswordResponse } from './types'

// Sign in / sign out / session are handled by Auth.js (next-auth/react).
// These are the custom routes that wrap it: registration and password reset.

export const signUp = async (email: string, password: string): Promise<SignUpResponse> => {
  const res = await apiClient.post<SignUpResponse>('/auth/register', { email, password })
  return res.data
}

export const forgotPassword = async (email: string): Promise<void> => {
  await apiClient.post('/auth/forgot-password', { email })
}

export const resetPassword = async (email: string, code: string, newPassword: string): Promise<ResetPasswordResponse> => {
  const res = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', { email, code, newPassword })
  return res.data
}
