import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PendingVerification } from '../types'

interface PendingReset {
  email: string
  code: string
}

interface AuthState {
  // Drives the /verify-code screen of the password reset flow (persisted so a
  // refresh keeps the flow).
  pendingVerification: PendingVerification | null
  // Drives the /reset-password screen (memory only).
  pendingReset: PendingReset | null
}

interface AuthActions {
  setPendingVerification: (v: PendingVerification) => void
  clearPendingVerification: () => void
  setPendingReset: (r: PendingReset) => void
  clearPendingReset: () => void
}

// Auth session state now lives in Auth.js (useSession). This store only holds
// transient state for the multi-step password reset flow.
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      pendingVerification: null,
      pendingReset: null,

      setPendingVerification: (v) => set({ pendingVerification: v }),
      clearPendingVerification: () => set({ pendingVerification: null }),
      setPendingReset: (r) => set({ pendingReset: r }),
      clearPendingReset: () => set({ pendingReset: null }),
    }),
    {
      name: 'destacai-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ pendingVerification: state.pendingVerification }),
    },
  ),
)
