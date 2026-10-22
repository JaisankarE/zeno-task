import type { FailureCode, StepKey } from '../types'
import { config } from '../config'

export const FAILURES: Record<
  FailureCode,
  { title: string; message: string; resolution: string; step: StepKey }
> = {
  RFID_INVALID: {
    title: 'Unregistered RFID',
    message: 'RFID card is not registered with any Zeno customer.',
    resolution: 'Session rejected. No doors opened.',
    step: 'auth',
  },
  RFID_BLOCKED: {
    title: 'Account blocked',
    message: 'Customer account is blocked due to overdue payments.',
    resolution: 'Customer asked to clear dues in the Zeno app.',
    step: 'auth',
  },
  NO_CHARGED_BATTERY: {
    title: 'No charged battery',
    message: `Station has fewer than ${config.batteriesPerBike} charged batter${config.batteriesPerBike === 1 ? 'y' : 'ies'} or no empty slot.`,
    resolution: 'Customer redirected to the nearest station.',
    step: 'auth',
  },
  BATTERY_MISMATCH: {
    title: 'Battery ID mismatch',
    message: 'Inserted battery ID does not match the batteries linked to this RFID.',
    resolution: 'Door re-opened, battery returned to customer.',
    step: 'collect',
  },
  DOOR_TIMEOUT: {
    title: 'Door not closed',
    message: 'Box door was not closed within the allowed time.',
    resolution: 'Session auto-cancelled, slot locked for inspection.',
    step: 'collect',
  },
  SLOT_JAM: {
    title: 'Slot lock jammed',
    message: 'Door actuator did not respond while opening the box.',
    resolution: 'Slot marked faulty, maintenance ticket raised.',
    step: 'exchange',
  },
  BATTERY_FAULT: {
    title: 'Battery fault detected',
    message: 'Returned battery reported critical temperature (> 60°C).',
    resolution: 'Battery quarantined, field team notified.',
    step: 'exchange',
  },
  COMM_LOST: {
    title: 'Connection lost',
    message: 'Station lost connection to the Zeno cloud mid-session.',
    resolution: 'Session rolled back, customer not charged.',
    step: 'dispense',
  },
  USER_ABORT: {
    title: 'Cancelled by customer',
    message: 'Customer cancelled the swap on the kiosk screen.',
    resolution: 'Session closed, batteries returned to customer.',
    step: 'collect',
  },
}

export const STEP_LABELS: Record<StepKey, string> = {
  auth: 'RFID verified',
  collect: 'Collect · C.Bat1 into empty box',
  exchange:
    config.batteriesPerBike === 2 ? 'Exchange · take S.Bat1, insert C.Bat2' : 'Exchange · take S.Bat(n), insert C.Bat(n+1)',
  dispense: `Dispense · take S.Bat${config.batteriesPerBike}`,
  payment: 'Bill posted to customer app',
}

/** Usable capacity of one Zeno pack in kWh */
export const PACK_KWH = config.packKwh
export const TARIFF_PER_KWH = config.tariffPerKwh
export const SERVICE_FEE = config.serviceFee

export function swapBill(inSoc: number[], outSoc: number[]) {
  const energyKwh = outSoc.reduce((sum, out, i) => sum + ((out - (inSoc[i] ?? 0)) / 100) * PACK_KWH, 0)
  const kwh = Math.max(0, Math.round(energyKwh * 100) / 100)
  return { energyKwh: kwh, amount: Math.round(kwh * TARIFF_PER_KWH + SERVICE_FEE) }
}

/** Swap ID is built from the customer battery IDs (whiteboard rule) plus a timestamp. */
export function makeSwapId(customerBatteries: (string | null)[], at: Date) {
  const short = (id: string | null | undefined) => (id ? id.replace('ZB-', '') : 'XXXX')
  const ids = Array.from({ length: config.batteriesPerBike }, (_, i) => short(customerBatteries[i]))
  const stamp = `${String(at.getMonth() + 1).padStart(2, '0')}${String(at.getDate()).padStart(2, '0')}${String(at.getHours()).padStart(2, '0')}${String(at.getMinutes()).padStart(2, '0')}`
  return `SW-${ids.join('')}-${stamp}`
}

export type DoorKey = 'collect' | 'exchange' | 'dispense'

/** One door of a swap. `take` is the charged station battery waiting in that box. */
export type Door = { key: DoorKey; box: number; take: string | null }

/**
 * Boxes a swap uses, in order: Collect (empty box ← C.Bat1), one Exchange per extra battery
 * (take S.Bat(n), insert C.Bat(n+1)), then Dispense (take the last S.Bat).
 */
export function swapDoors(emptyBox: number, charged: Array<{ box: number; batteryId: string }>): Door[] {
  const last = charged[charged.length - 1]
  return [
    { key: 'collect', box: emptyBox, take: null },
    ...charged.slice(0, -1).map((c) => ({ key: 'exchange' as const, box: c.box, take: c.batteryId })),
    { key: 'dispense', box: last.box, take: last.batteryId },
  ]
}

export const rangeKm = (soc: number) => Math.round(soc * config.kmPerPercent)
