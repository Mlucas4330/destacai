import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'DestacAI',
  description: 'Generate a tailored, ATS-optimized CV for every job you apply to.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className='font-ui antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
