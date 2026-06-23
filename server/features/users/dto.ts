export interface UserProfileResponse {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  isAdmin: boolean
  cvFileName: string | null
  hasCv: boolean
}

export interface UpsertProfileRequest {
  email: string
}
