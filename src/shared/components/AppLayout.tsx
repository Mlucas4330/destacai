'use client'

import { useEffect } from 'react'
import TopBar from '@/shared/components/TopBar'
import Drawer from '@/shared/components/Drawer'
import Jobs from '@/screens/Jobs'
import AddJob from '@/features/jobs/components/AddJob'
import Config from '@/screens/Config'
import { useUiStore } from '@/shared/stores/ui'

// The single authed page: the job list is the page; Add job and Settings open as
// right-side drawers driven by local UI state (not the URL).
const AppLayout = () => {
  const drawer = useUiStore((s) => s.drawer)
  const closeDrawer = useUiStore((s) => s.closeDrawer)

  // Close any open drawer when leaving the app shell (e.g. navigating to auth).
  useEffect(() => closeDrawer, [closeDrawer])

  return (
    <div className='min-h-screen flex flex-col bg-surface'>
      <TopBar />
      <main className='flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8'>
        <Jobs />
      </main>

      <Drawer open={drawer === 'add-job'} onClose={closeDrawer} title='Add job'>
        <AddJob />
      </Drawer>
      <Drawer open={drawer === 'config'} onClose={closeDrawer} title='Settings'>
        <Config />
      </Drawer>
    </div>
  )
}

export default AppLayout
