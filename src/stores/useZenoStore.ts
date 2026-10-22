import { config } from '../config'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createDemoData, type DemoData } from '../data/mock'
import type { Swap } from '../types'

/** Saved per machine shape, so changing batteries/boxes in .env starts with fresh demo data */
const STORAGE_KEY = `zeno-demo-data-${config.batteriesPerBike}p-${config.boxesPerStation}b`

type ZenoState = DemoData & {
  /** Records a kiosk session. Successful swaps move batteries between bike and station. */
  commitSwap: (swap: Swap) => void
  payBill: (swapId: string) => void
  payAll: (customerId: string) => void
  /** Testing helper: overwrite the state of charge of specific batteries */
  setBatterySoc: (socById: Record<string, number>) => void
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

          const { inBatteries, outBatteries } = swap
          const { collect, exchange, dispense } = swap.slots
          const batteries = { ...state.batteries }

          for (const id of outBatteries) {
            if (id) batteries[id] = { ...batteries[id], status: 'in-vehicle', location: swap.customerId }
          }
          for (const id of inBatteries) {
            if (id) batteries[id] = { ...batteries[id], status: 'charging', location: swap.stationId }
          }

          // Collect box gets C.Bat1, each exchange box gets the next C.Bat, the dispense box is left empty
          const incoming = new Map<number, string | null>()
          if (collect !== null) incoming.set(collect, inBatteries[0])
          exchange.forEach((box, j) => incoming.set(box, inBatteries[j + 1]))

          const stations = state.stations.map((st) =>
            st.id !== swap.stationId
              ? st
              : {
                  ...st,
                  slots: st.slots.map((slot) => {
                    if (incoming.has(slot.no)) return { ...slot, state: 'charging' as const, batteryId: incoming.get(slot.no)! }
                    if (slot.no === dispense) return { ...slot, state: 'empty' as const, batteryId: null }
                    return slot
                  }),
                },
          )

          const received = outBatteries.filter((id): id is string => !!id)
          const customers = state.customers.map((c) =>
            c.id === swap.customerId && received.length === outBatteries.length ? { ...c, batteryIds: received } : c,
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

      setBatterySoc: (socById) =>
        set((state) => {
          const batteries = { ...state.batteries }
          for (const [id, soc] of Object.entries(socById)) {
            if (batteries[id]) batteries[id] = { ...batteries[id], soc }
          }
          return { batteries }
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
            const soc = Math.min(100, b.soc + config.chargeStepPercent)
            const ready = soc >= config.readySoc
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
    {
      name: STORAGE_KEY,
      // v3: any number of batteries per bike / boxes per station — old saved data is regenerated
      version: 3,
      migrate: () => createDemoData() as unknown as ZenoState,
    },
  ),
)

// Keep tabs in sync: a swap on the kiosk tab updates the rider/admin tabs instantly
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) void useZenoStore.persist.rehydrate()
  })
}
