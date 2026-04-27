import { createContext, useContext, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '@shared/constants'

interface AuthState {
  token: string | null
  email: string | null
}

export interface PendingVerification {
  email: string
  purpose: 'email-verification' | 'password-reset'
}

interface AuthContextValue {
  isLoaded: boolean
  isSignedIn: boolean
  pendingVerification: PendingVerification | null
  getToken: () => Promise<string | null>
  signOut: () => Promise<void>
  login: (token: string, email: string) => Promise<void>
  clearPendingVerification: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [auth, setAuth] = useState<AuthState>({ token: null, email: null })
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null)

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEYS.AUTH, STORAGE_KEYS.PENDING_VERIFICATION], (result) => {
      const stored = result[STORAGE_KEYS.AUTH] as AuthState | undefined
      if (stored?.token) setAuth(stored)
      const pending = result[STORAGE_KEYS.PENDING_VERIFICATION] as PendingVerification | undefined
      if (pending?.email) setPendingVerification(pending)
      setIsLoaded(true)
    })
  }, [])

  const login = async (token: string, email: string) => {
    const next = { token, email }
    await chrome.storage.local.set({ [STORAGE_KEYS.AUTH]: next })
    setAuth(next)
  }

  const signOut = async () => {
    await chrome.storage.local.remove([STORAGE_KEYS.AUTH, STORAGE_KEYS.PENDING_VERIFICATION])
    setAuth({ token: null, email: null })
    setPendingVerification(null)
  }

  const clearPendingVerification = async () => {
    await chrome.storage.local.remove(STORAGE_KEYS.PENDING_VERIFICATION)
    setPendingVerification(null)
  }

  const getToken = async () => auth.token

  return (
    <AuthContext.Provider value={{ isLoaded, isSignedIn: !!auth.token, pendingVerification, getToken, signOut, login, clearPendingVerification }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}
