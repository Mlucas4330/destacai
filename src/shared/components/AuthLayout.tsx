import Link from 'next/link'

// Centered card layout for the auth flows (sign in/up, verify, reset).
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className='min-h-screen flex flex-col items-center justify-center gap-4 bg-surface px-4 py-8'>
    <div className='w-full max-w-sm bg-canvas border border-border rounded-2xl shadow-sm'>
      {children}
    </div>
    <Link href='/privacy' className='text-xs text-navy-muted hover:text-navy underline underline-offset-2 transition-colors'>
      Privacy Policy
    </Link>
  </div>
)

export default AuthLayout
