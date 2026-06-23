import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PendingVerification } from '../types'

interface PendingReset {
  email: string
  code: string
}

interface AuthState {
  // Drives the /verify-code screen (persisted so a refresh keeps the flow).
  pendingVerification: PendingVerification | null
  // Kept in memory only so we can auto sign-in right after email verification.
  pendingPassword: string | null
  // Drives the /reset-password screen (memory only).
  pendingReset: PendingReset | null
}

interface AuthActions {
  setPendingVerification: (v: PendingVerification, password?: string) => void
  clearPendingVerification: () => void
  setPendingReset: (r: PendingReset) => void
  clearPendingReset: () => void
}

// Auth session state now lives in Auth.js (useSession). This store only holds
// transient state for the multi-step email-code flows.
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      pendingVerification: null,
      pendingPassword: null,
      pendingReset: null,

      setPendingVerification: (v, password) =>
        set({ pendingVerification: v, pendingPassword: password ?? null }),
      clearPendingVerification: () => set({ pendingVerification: null, pendingPassword: null }),
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
