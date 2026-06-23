'use client'

import ConfigForm from '@/features/config/components/ConfigForm'

const Config = () => {
  return (
    <div className='flex flex-col gap-6'>
      <p className='text-sm text-navy-muted'>Changes are saved automatically.</p>
      <ConfigForm />
    </div>
  )
}

export default Config
