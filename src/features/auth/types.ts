export interface SignUpResponse {
  message: string
  email: string
}

export interface VerifyCodeResponse {
  message: string
}

export interface ResetPasswordResponse {
  message: string
}

export interface PendingVerification {
  email: string
  purpose: 'email-verification' | 'password-reset'
}

export interface VerifyCodeFormProps {
  email: string
  purpose: 'email-verification' | 'password-reset'
}

export interface ResetPasswordFormProps {
  email: string
  code: string
}
