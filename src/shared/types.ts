export interface UserProfile {
  id: string
  email: string | null
  isAdmin: boolean
  cvFileName: string | null
  hasCv: boolean
  firstName: string | null
  lastName: string | null
}
