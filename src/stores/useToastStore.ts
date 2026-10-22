import { create } from 'zustand'
import { config } from '../config'

export type Toast = {
  id: number
  title: string
  body?: string
  tone: 'success' | 'error' | 'info'
}

type ToastState = {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>, ttlMs?: number) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast, ttlMs = config.toastSeconds * 1000) => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    window.setTimeout(() => get().dismiss(id), ttlMs)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = (t: Omit<Toast, 'id'>, ttlMs?: number) => useToastStore.getState().push(t, ttlMs)
