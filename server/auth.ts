import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from '@server/auth.config'
import { validateCredentials } from '@server/features/auth/service'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== 'string' || typeof password !== 'string') return null
        const user = await validateCredentials(email, password)
        if (!user) return null
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
        return { id: user.id, email: user.email ?? undefined, name: name || undefined }
      },
    }),
  ],
})
