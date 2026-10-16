import { create } from 'zustand'

export type ToastTone = 'info' | 'success' | 'error'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

interface UiState {
  searchOpen: boolean
  toasts: Toast[]
  openSearch(): void
  closeSearch(): void
  toast(message: string, tone?: ToastTone): void
  dismissToast(id: number): void
}

const MAX_TOASTS = 3
let nextToastId = 1

export const useUi = create<UiState>()((set) => ({
  searchOpen: false,
  toasts: [],
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  toast: (message, tone = 'info') => {
    const toast = { id: nextToastId++, message, tone }
    set((state) => ({ toasts: [...state.toasts, toast].slice(-MAX_TOASTS) }))
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
