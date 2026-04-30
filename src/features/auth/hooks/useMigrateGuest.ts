// import { useQueryClient } from '@tanstack/react-query'
// import { useAuthContext } from '@/features/auth/stores/auth'
// import { useGuestContext } from '@/features/auth/stores/GuestContext'
// import { QUERY_KEYS } from '@/shared/constants'
// import { migrateGuest } from '../services/auth'

export function useMigrateGuest() {
  // const { getToken } = useAuthContext()
  // const { guestId, guestJobs, guestCvR2Key, clearGuestData } = useGuestContext()
  // const qc = useQueryClient()

  // return async () => {
  //   if (!guestJobs.length && !guestCvR2Key) return

  //   const token = await getToken()
  //   if (!token) return

  //   await migrateGuest(token, guestId, guestJobs, guestCvR2Key)
  //   await clearGuestData()
  //   qc.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] })
  //   qc.invalidateQueries({ queryKey: [QUERY_KEYS.USER] })
  // }
}
