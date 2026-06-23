import NextAuth from 'next-auth'
import { authConfig } from '@server/auth.config'

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  // Run on all routes except Next internals, the auth API, and static assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|txt)$).*)'],
}
