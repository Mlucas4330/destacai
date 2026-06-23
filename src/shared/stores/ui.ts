import { create } from 'zustand'

type DrawerType = 'add-job' | 'config' | null

interface UiState {
  drawer: DrawerType
  openDrawer: (drawer: Exclude<DrawerType, null>) => void
  closeDrawer: () => void
}

// Transient app-shell UI state. The Add job / Settings panels are overlays, not
// destinations, so they live in local state rather than the URL.
export const useUiStore = create<UiState>((set) => ({
  drawer: null,
  openDrawer: (drawer) => set({ drawer }),
  closeDrawer: () => set({ drawer: null }),
}))
