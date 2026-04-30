import type { GuestJob, UserProfile } from "@/shared/types"

export interface SignInRequest {
  email: string
  password: string
}

export interface SignInResponse {
  token: string
  user: { email: string }
}

export interface SignUpResponse {
  token: string
  user: { email: string }
}

export interface VerifyCodeResponse {
  token: string
  user: UserProfile
}

export interface ResetPasswordResponse {
  message: string
}

export interface UserProps {
  token: string | null
  email: string | null
}

export interface AuthGateProps {
  children: React.ReactNode
}

export interface PendingVerification {
  email: string
  purpose: 'email-verification' | 'password-reset'
}

export interface AuthContextValue {
  isLoaded: boolean
  isSignedIn: boolean
  pendingVerification: PendingVerification | null
  getToken: () => Promise<string | null>
  signOut: () => Promise<void>
  login: (token: string, email: string) => Promise<void>
  clearPendingVerification: () => Promise<void>
}

export interface VerifyCodeFormProps {
  email: string
  purpose: 'email-verification' | 'password-reset'
}

export interface ResetPasswordFormProps {
  email: string
  code: string
}

export interface GuestContextValue {
  guestId: string
  guestJobs: GuestJob[]
  guestGenerationsUsed: number
  guestCvR2Key: string | null
  showLimitModal: boolean
  addGuestJob: (job: GuestJob) => Promise<void>
  deleteGuestJob: (id: string) => Promise<void>
  clearGuestJobs: () => Promise<void>
  updateGuestJob: (id: string, patch: Partial<GuestJob>) => Promise<void>
  incrementGuestGenerations: () => Promise<void>
  setGuestCvR2Key: (key: string | null) => Promise<void>
  triggerLimitModal: () => void
  dismissLimitModal: () => void
  clearGuestData: () => Promise<void>
  handleSignIn: () => void
  handleSignUp: () => void
}