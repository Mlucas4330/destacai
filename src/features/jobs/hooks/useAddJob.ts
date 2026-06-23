import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateJob } from './useJobs'
import { storageClient } from '@/lib/storageClient'
import { useUiStore } from '@/shared/stores/ui'
import { STORAGE_KEYS } from '../constants'
import { AddJobSchema } from '../schemas'

type AddJobInput = z.infer<typeof AddJobSchema>

const PENDING_KEYS = [STORAGE_KEYS.PENDING_DESCRIPTION, STORAGE_KEYS.OPEN_ADD_JOB]

const useAddJob = () => {
  const { register, handleSubmit, formState, setValue, watch } = useForm<AddJobInput>({
    resolver: zodResolver(AddJobSchema),
    defaultValues: { title: '', company: '', description: '' },
  })
  const createJob = useCreateJob()
  const closeDrawer = useUiStore((s) => s.closeDrawer)

  const description = watch('description')

  useEffect(() => {
    storageClient.get<string>(STORAGE_KEYS.PENDING_DESCRIPTION).then((desc) => {
      if (!desc) return
      setValue('description', desc)
    })
  }, [setValue])

  useEffect(() => { if (description) storageClient.set(STORAGE_KEYS.PENDING_DESCRIPTION, description) }, [description])

  const onSubmit = handleSubmit((data) => {
    createJob.mutate(
      { title: data.title.trim(), company: data.company.trim(), description: data.description.trim() },
      {
        onSuccess: () => {
          storageClient.remove(PENDING_KEYS)
          closeDrawer()
        },
      },
    )
  })

  return {
    register,
    formState,
    onSubmit,
    isPending: createJob.isPending,
  }
}

export default useAddJob
