'use client'

import { SessionProvider } from 'next-auth/react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { Toaster } from 'react-hot-toast'
import { queryClient, persister } from '@/lib/queryClient'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        {children}
        <Toaster
          position='bottom-center'
          toastOptions={{
            className: 'bg-navy text-bg text-xs rounded-xl max-w-xs font-ui',
            duration: 2000,
          }}
        />
      </PersistQueryClientProvider>
    </SessionProvider>
  )
}
