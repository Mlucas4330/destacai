export interface SignUpResponse {
  message: string
  email: string
}

export interface ResetPasswordResponse {
  message: string
}

export interface PendingVerification {
  email: string
}

export interface VerifyCodeFormProps {
  email: string
}

export interface ResetPasswordFormProps {
  email: string
  code: string
}
