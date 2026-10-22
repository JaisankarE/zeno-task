export type BatteryStatus = 'in-vehicle' | 'charging' | 'ready' | 'faulty'

export type Battery = {
  id: string
  soc: number
  health: number
  cycles: number
  tempC: number
  status: BatteryStatus
  /** Customer id when in a vehicle, station id when docked */
  location: string
}

export type Plan = 'Pay per swap'

export type Customer = {
  id: string
  name: string
  phone: string
  email: string
  rfid: string
  city: string
  vehicle: { model: string; regNo: string }
  /** One id per battery in the bike (VITE_BATTERIES_PER_BIKE) */
  batteryIds: string[]
  plan: Plan
  status: 'active' | 'blocked'
  joinedAt: string
}

export type SlotState = 'empty' | 'charging' | 'ready' | 'faulty'

export type Slot = {
  no: number
  state: SlotState
  batteryId: string | null
}

export type Station = {
  id: string
  name: string
  area: string
  city: string
  distanceKm: number
  status: 'online' | 'offline' | 'maintenance'
  slots: Slot[]
}

export type SwapStatus = 'success' | 'failed' | 'aborted'

/** Collect → empty slot ← C.Bat1, Exchange → S.Bat(n) ⇄ C.Bat(n+1), Dispense → last S.Bat */
export type StepKey = 'auth' | 'collect' | 'exchange' | 'dispense' | 'payment'

export type SwapStep = {
  key: StepKey
  label: string
  at: string
  ok: boolean
  slot?: number
  batteryId?: string
  note?: string
}

export type FailureCode =
  | 'RFID_INVALID'
  | 'RFID_BLOCKED'
  | 'NO_CHARGED_BATTERY'
  | 'BATTERY_MISMATCH'
  | 'DOOR_TIMEOUT'
  | 'SLOT_JAM'
  | 'BATTERY_FAULT'
  | 'COMM_LOST'
  | 'USER_ABORT'

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'none'

export type Swap = {
  /** Swap ID = customer battery IDs + time stamp */
  id: string
  customerId: string | null
  rfid: string
  stationId: string
  startedAt: string
  endedAt: string
  status: SwapStatus
  /** Customer batteries returned to the station: C.Bat1, C.Bat2, … */
  inBatteries: (string | null)[]
  /** Station batteries handed to the customer: S.Bat1, S.Bat2, … */
  outBatteries: (string | null)[]
  /** Exchange holds one box per extra battery (none for a 1-battery bike) */
  slots: { collect: number | null; exchange: number[]; dispense: number | null }
  steps: SwapStep[]
  failure?: { code: FailureCode; step: StepKey; message: string; resolution: string }
  energyKwh: number
  amount: number
  payment: PaymentStatus
}
