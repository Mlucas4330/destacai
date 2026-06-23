import type { NextAuthConfig } from 'next-auth'

const PUBLIC_PATHS = [
  '/sign-in',
  '/sign-up',
  '/verify-code',
  '/forgot-password',
  '/reset-password',
  '/privacy',
]

/**
 * Edge-safe Auth.js configuration shared by the middleware and the full server
 * config. It must NOT import the database, bcrypt, or anything Node-only, so the
 * middleware can run on the edge runtime. The Credentials provider (which needs
 * the DB) is added in `auth.ts`.
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in' },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = request.nextUrl
      const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
      if (isPublic) return true
      return isLoggedIn
    },
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string
      return session
    },
  },
} satisfies NextAuthConfig
