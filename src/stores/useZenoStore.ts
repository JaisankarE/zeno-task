import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createDemoData, type DemoData } from '../data/mock'
import type { Swap } from '../types'

type ZenoState = DemoData & {
  /** Records a kiosk session. Successful swaps move batteries between bike and station. */
  commitSwap: (swap: Swap) => void
  payBill: (swapId: string) => void
  payAll: (customerId: string) => void
  /** Fast-charge simulation for docked batteries at one station */
  tickCharging: (stationId: string) => void
  resetDemo: () => void
}

export const useZenoStore = create<ZenoState>()(
  persist(
    (set) => ({
      ...createDemoData(),

      commitSwap: (swap) =>
        set((state) => {
          const swaps = [swap, ...state.swaps]
          if (swap.status !== 'success' || !swap.customerId) return { swaps }

          const [cBat1, cBat2] = swap.inBatteries
          const [sBat1, sBat2] = swap.outBatteries
          const { collect, exchange, dispense } = swap.slots
          const batteries = { ...state.batteries }

          for (const id of [sBat1, sBat2]) {
            if (id) batteries[id] = { ...batteries[id], status: 'in-vehicle', location: swap.customerId }
          }
          for (const id of [cBat1, cBat2]) {
            if (id) batteries[id] = { ...batteries[id], status: 'charging', location: swap.stationId }
          }

          const stations = state.stations.map((st) =>
            st.id !== swap.stationId
              ? st
              : {
                  ...st,
                  slots: st.slots.map((slot) => {
                    if (slot.no === collect) return { ...slot, state: 'charging' as const, batteryId: cBat1 }
                    if (slot.no === exchange) return { ...slot, state: 'charging' as const, batteryId: cBat2 }
                    if (slot.no === dispense) return { ...slot, state: 'empty' as const, batteryId: null }
                    return slot
                  }),
                },
          )

          const customers = state.customers.map((c) =>
            c.id === swap.customerId && sBat1 && sBat2 ? { ...c, batteryIds: [sBat1, sBat2] as [string, string] } : c,
          )

          return { swaps, batteries, stations, customers }
        }),

      payBill: (swapId) =>
        set((state) => ({
          swaps: state.swaps.map((s) => (s.id === swapId ? { ...s, payment: 'paid' } : s)),
        })),

      payAll: (customerId) =>
        set((state) => {
          const swaps = state.swaps.map((s) =>
            s.customerId === customerId && (s.payment === 'pending' || s.payment === 'failed')
              ? { ...s, payment: 'paid' as const }
              : s,
          )
          // Clearing dues unblocks the account
          const customers = state.customers.map((c) =>
            c.id === customerId ? { ...c, status: 'active' as const } : c,
          )
          return { swaps, customers }
        }),

      tickCharging: (stationId) =>
        set((state) => {
          const station = state.stations.find((s) => s.id === stationId)
          if (!station || station.status !== 'online') return {}
          const batteries = { ...state.batteries }
          let changed = false
          const slots = station.slots.map((slot) => {
            if (slot.state !== 'charging' || !slot.batteryId) return slot
            const b = batteries[slot.batteryId]
            const soc = Math.min(100, b.soc + 2)
            const ready = soc >= 96
            batteries[b.id] = { ...b, soc, status: ready ? 'ready' : 'charging' }
            changed = true
            return ready ? { ...slot, state: 'ready' as const } : slot
          })
          if (!changed) return {}
          return {
            batteries,
            stations: state.stations.map((s) => (s.id === stationId ? { ...s, slots } : s)),
          }
        }),

      resetDemo: () => set(createDemoData()),
    }),
    { name: 'zeno-demo-data', version: 1 },
  ),
)
