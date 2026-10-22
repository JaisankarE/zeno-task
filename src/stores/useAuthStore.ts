import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ADMIN_CREDENTIALS } from '../data/mock'

type AuthState = {
  admin: string | null
  customerId: string | null
  loginAdmin: (username: string, password: string) => boolean
  loginCustomer: (customerId: string) => void
  logoutAdmin: () => void
  logoutCustomer: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      customerId: null,
      loginAdmin: (username, password) => {
        const ok =
          username.trim() === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password
        if (ok) set({ admin: username.trim() })
        return ok
      },
      loginCustomer: (customerId) => set({ customerId }),
      logoutAdmin: () => set({ admin: null }),
      logoutCustomer: () => set({ customerId: null }),
    }),
    { name: 'zeno-auth' },
  ),
)
