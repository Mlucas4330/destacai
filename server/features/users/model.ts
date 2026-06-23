export interface UserProfile {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  isAdmin: boolean
  cvFileName: string | null
  hasCv: boolean
}
