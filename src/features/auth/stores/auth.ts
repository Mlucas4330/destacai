// import { createContext, useContext, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../constants'
import type { UserProps, PendingVerification } from '../types'
import { create } from 'zustand'

interface AuthState {
  loggedUser: UserProps | null
  pendingVerification: PendingVerification | null
}

interface AuthAction {
  checkPendingVerification: () => Promise<boolean>
  signIn: (token: string, email: string) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState & AuthAction>(set => ({
  loggedUser: null,
  pendingVerification: null,

  checkPendingVerification: async () => {
    const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_VERIFICATION)
    const pending = result[STORAGE_KEYS.PENDING_VERIFICATION] as PendingVerification | null
    set({ pendingVerification: pending })
    return false
  },

  signIn: async (token: string, email: string) => {
    const next = { token, email }
    await chrome.storage.local.set({ [STORAGE_KEYS.AUTH]: next })
    set({ loggedUser: next })
  },

  signOut: async () => {
    await chrome.storage.local.remove([STORAGE_KEYS.AUTH, STORAGE_KEYS.PENDING_VERIFICATION])
    localStorage.clear()
    set({
      loggedUser: null,
      pendingVerification: null
    })
  }
}))
