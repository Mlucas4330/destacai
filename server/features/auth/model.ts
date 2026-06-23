export interface User {
  id: string
  email: string | null
  isAdmin: boolean
  cvR2Key: string | null
  cvFileName: string | null
  firstName: string | null
  lastName: string | null
  emailVerified: boolean
  createdAt: Date
}
