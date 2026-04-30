import { apiClient } from '@/lib/api.client'
import type {
  // ResetPasswordResponse,
  SignInRequest,
  SignInResponse,
  // SignUpResponse,
  // VerifyCodeResponse,
} from '../types'

export async function signIn(data: SignInRequest): Promise<SignInResponse> {
  const response = await apiClient.post<SignInResponse>('/auth/login', data)
  return response.data
}

// export async function signUp(email: string, password: string): Promise<SignUpResponse> {
//   return fetchApi<SignUpResponse>({
//     method: 'POST',
//     path: '/auth/register',
//     body: { email, password },
//   })
// }

// export async function forgotPassword(email: string): Promise<void> {
//   await fetchApi<void>({
//     method: 'POST',
//     path: '/auth/forgot-password',
//     body: { email },
//   })
// }

// export async function verifyCode(email: string, code: string): Promise<VerifyCodeResponse> {
//   return fetchApi<VerifyCodeResponse>({
//     method: 'POST',
//     path: '/auth/verify-code',
//     body: { email, code },
//   })
// }

// export async function resetPassword(
//   email: string,
//   code: string,
//   newPassword: string,
// ): Promise<ResetPasswordResponse> {
//   return fetchApi<ResetPasswordResponse>({
//     method: 'POST',
//     path: '/auth/reset-password',
//     body: { email, code, newPassword },
//   })
// }

// export async function migrateGuest(
//   token: string,
//   guestId: string,
//   guestJobs: GuestJob[],
//   guestCvR2Key: string | null,
// ): Promise<void> {
//   await fetchApi<void>({
//     method: 'POST',
//     path: '/auth/migrate-guest',
//     body: { guestId, guestJobs, guestCvR2Key },
//     token,
//   })
// }
