import Input from '@/shared/components/Input'
import Button from '@/shared/components/Button'
import useAddJob from '../hooks/useAddJob'
import { useHasCv } from '@/features/config/hooks/useUser'
import { useUiStore } from '@/shared/stores/ui'
import { storageClient } from '@/lib/storageClient'
import { STORAGE_KEYS } from '../constants'

const AddJob = () => {
  const closeDrawer = useUiStore((s) => s.closeDrawer)
  const hasCv = useHasCv()

  const {
    register,
    formState,
    onSubmit,
    isPending,
  } = useAddJob()

  return (
    <div className='flex flex-col gap-5'>
      <p className='text-sm text-navy-muted'>Fill in the details for this position.</p>

      <form onSubmit={onSubmit} className='flex flex-col gap-4'>
        <Input
          id='job-title'
          label='Job Title'
          placeholder='e.g. Senior Frontend Engineer'
          autoComplete='organization-title'
          error={formState.errors.title?.message}
          {...register('title')}
        />
        <Input
          id='job-company'
          label='Company'
          placeholder='e.g. Acme Corp'
          autoComplete='organization'
          error={formState.errors.company?.message}
          {...register('company')}
        />
        <div className='flex flex-col gap-1.5'>
          <label htmlFor='job-description' className='text-sm font-medium text-navy-muted'>Job Description</label>
          <textarea
            id='job-description'
            placeholder='Paste the job description here...'
            rows={8}
            className='px-3.5 py-2.5 rounded-xl border border-border focus:border-navy-muted bg-bg text-sm outline-none transition-colors resize-none'
            {...register('description')}
          />
          {formState.errors.description && (
            <span className='text-xs text-danger'>{formState.errors.description.message}</span>
          )}
        </div>

        {!hasCv && (
          <p className='text-sm text-warn bg-warn-surface border border-warn/25 rounded-lg px-3 py-2'>
            You need to upload your CV in Settings before saving jobs.
          </p>
        )}

        <div className='flex gap-2 pt-1'>
          <Button
            type='button'
            variant='secondary'
            onClick={() => {
              storageClient.remove([STORAGE_KEYS.PENDING_DESCRIPTION, STORAGE_KEYS.PENDING_TITLE, STORAGE_KEYS.PENDING_COMPANY, STORAGE_KEYS.OPEN_ADD_JOB])
              closeDrawer()
            }}
            className='flex-1'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isPending || !hasCv}
            className='flex-1'
          >
            {isPending ? 'Saving...' : 'Save Job'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AddJob
