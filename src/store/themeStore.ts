import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  dark: boolean
  isDark: boolean
  toggle: () => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      dark: false,
      isDark: false,
      toggle: () => {
        const next = !get().dark
        document.documentElement.classList.toggle('dark', next)
        set({ dark: next, isDark: next })
      },
      toggleTheme: () => {
        const next = !get().dark
        document.documentElement.classList.toggle('dark', next)
        set({ dark: next, isDark: next })
      }
    }),
    {
      name: 'ps-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isDark = state.dark
          document.documentElement.classList.toggle('dark', state.dark)
        }
      }
    }
  )
)
