import { useZenoStore } from '../../stores/useZenoStore'

export function useLookups() {
  const customers = useZenoStore((s) => s.customers)
  const stations = useZenoStore((s) => s.stations)
  return {
    customer: (id: string | null) => customers.find((c) => c.id === id),
    station: (id: string) => stations.find((s) => s.id === id),
  }
}
