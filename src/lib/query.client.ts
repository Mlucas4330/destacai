import { QUERY_RETRY, QUERY_STALE_TIME } from '@/shared/constants'
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      retry: QUERY_RETRY,
    },
  },
})
