import { FAILURES, STEP_LABELS, makeSwapId, swapBill } from '../lib/swap'
import type {
  Battery,
  Customer,
  FailureCode,
  Slot,
  SlotState,
  Station,
  StepKey,
  Swap,
  SwapStep,
} from '../types'

export const ADMIN_CREDENTIALS = { username: 'admin', password: 'zeno@123' }

/** Deterministic PRNG so the demo data is the same on every reset */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CUSTOMER_SEED: Array<
  [name: string, phone: string, rfid: string, city: string, model: string, regNo: string, plan: Customer['plan'], soc: [number, number]]
> = [
  ['Arjun Mehta', '+91 98450 12345', 'RF-7A3F21C9', 'Bengaluru', 'Zeno Volt X', 'KA 05 MX 4521', 'Pay per swap', [14, 11]],
  ['Priya Raman', '+91 94440 23871', 'RF-1B8C4D02', 'Chennai', 'Zeno Volt X', 'TN 09 BZ 1182', 'Unlimited monthly', [62, 58]],
  ['Karthik Subramanian', '+91 99620 77810', 'RF-9E2A6F14', 'Chennai', 'Zeno Cargo', 'TN 22 CK 9031', 'Pay per swap', [23, 19]],
  ['Divya Nair', '+91 97390 44128', 'RF-3C5D8E77', 'Bengaluru', 'Zeno Volt S', 'KA 01 HN 7744', 'Pay per swap', [81, 79]],
  ['Rahul Verma', '+91 98861 30954', 'RF-6F1E0A35', 'Bengaluru', 'Zeno Cargo', 'KA 03 JP 2210', 'Unlimited monthly', [37, 41]],
  ['Sneha Iyer', '+91 90030 66721', 'RF-2D7B9C46', 'Chennai', 'Zeno Volt S', 'TN 07 DA 5567', 'Pay per swap', [55, 52]],
  ['Vikram Reddy', '+91 99001 84432', 'RF-8A4E3B58', 'Bengaluru', 'Zeno Volt X', 'KA 51 MR 3390', 'Pay per swap', [9, 12]],
  ['Ananya Krishnan', '+91 95000 11908', 'RF-5B9F7D61', 'Chennai', 'Zeno Volt S', 'TN 10 AZ 8815', 'Unlimited monthly', [92, 90]],
  ['Mohammed Irfan', '+91 98400 52316', 'RF-4E6C2A83', 'Chennai', 'Zeno Cargo', 'TN 02 BQ 4402', 'Pay per swap', [44, 47]],
  ['Lakshmi Prasad', '+91 97411 90287', 'RF-0C3A5E92', 'Bengaluru', 'Zeno Volt X', 'KA 04 KL 6123', 'Pay per swap', [68, 71]],
  ['Suresh Kumar', '+91 94443 70519', 'RF-7D2F8B04', 'Chennai', 'Zeno Cargo', 'TN 11 CE 7781', 'Pay per swap', [31, 27]],
  ['Meera Joshi', '+91 99805 23674', 'RF-1F9E4C27', 'Bengaluru', 'Zeno Volt S', 'KA 02 FB 1046', 'Pay per swap', [76, 74]],
]

/** Customer index 10 (Suresh) is blocked for overdue payments — a failure case on the kiosk */
const BLOCKED_INDEX = 10

const STATION_SEED: Array<[id: string, name: string, area: string, city: string, km: number, status: Station['status'], layout: string]> = [
  // layout: 10 chars, one per box: e=empty c=charging r=ready f=faulty
  ['ZS-BLR-01', 'Koramangala Hub', '80 Feet Rd, Koramangala', 'Bengaluru', 1.2, 'online', 'cceFrrcrcr'],
  ['ZS-BLR-02', 'HSR Layout Sector 2', '27th Main, HSR Layout', 'Bengaluru', 3.4, 'online', 'rrcercrrce'],
  ['ZS-BLR-03', 'Indiranagar 100ft', '100 Feet Rd, Indiranagar', 'Bengaluru', 5.8, 'maintenance', 'fceccfeccc'],
  ['ZS-CHN-01', 'Velachery Main Rd', 'Velachery Main Rd, Velachery', 'Chennai', 2.1, 'online', 'rcrerrcrre'],
  ['ZS-CHN-02', 'OMR Thoraipakkam', 'Rajiv Gandhi Salai, Thoraipakkam', 'Chennai', 4.6, 'online', 'ccecccrcce'],
  ['ZS-CHN-03', 'Anna Nagar West', '2nd Ave, Anna Nagar', 'Chennai', 7.3, 'offline', 'rrrrcceccr'],
]

const pad = (n: number) => String(n).padStart(4, '0')

export type DemoData = {
  customers: Customer[]
  batteries: Record<string, Battery>
  stations: Station[]
  swaps: Swap[]
}

export function createDemoData(now = new Date()): DemoData {
  const rand = mulberry32(20261022)
  const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)]

  const batteries: Record<string, Battery> = {}
  let batteryNo = 1001
  const newBattery = (partial: Omit<Battery, 'id' | 'health' | 'cycles' | 'tempC'>) => {
    const id = `ZB-${pad(batteryNo++)}`
    batteries[id] = {
      id,
      health: int(84, 99),
      cycles: int(40, 620),
      tempC: int(27, 36),
      ...partial,
    }
    return id
  }

  const customers: Customer[] = CUSTOMER_SEED.map(([name, phone, rfid, city, model, regNo, plan, soc], i) => {
    const id = `CU-${pad(i + 101)}`
    const b1 = newBattery({ soc: soc[0], status: 'in-vehicle', location: id })
    const b2 = newBattery({ soc: soc[1], status: 'in-vehicle', location: id })
    const joined = new Date(now)
    joined.setDate(joined.getDate() - int(40, 420))
    return {
      id,
      name,
      phone,
      email: `${name.split(' ')[0].toLowerCase()}@example.com`,
      rfid,
      city,
      vehicle: { model, regNo },
      batteryIds: [b1, b2],
      plan,
      status: i === BLOCKED_INDEX ? 'blocked' : 'active',
      joinedAt: joined.toISOString(),
    }
  })

  const stations: Station[] = STATION_SEED.map(([id, name, area, city, km, status, layout]) => {
    const slots: Slot[] = layout.split('').map((ch, i) => {
      const code = ch.toLowerCase()
      const state: SlotState =
        code === 'e' ? 'empty' : code === 'c' ? 'charging' : code === 'r' ? 'ready' : 'faulty'
      if (state === 'empty') return { no: i + 1, state, batteryId: null }
      const soc = state === 'ready' ? int(96, 100) : state === 'charging' ? int(22, 88) : int(5, 40)
      const batteryId = newBattery({
        soc,
        status: state === 'ready' ? 'ready' : state === 'charging' ? 'charging' : 'faulty',
        location: id,
      })
      if (state === 'faulty') batteries[batteryId].tempC = int(58, 66)
      return { no: i + 1, state, batteryId }
    })
    return { id, name, area, city, distanceKm: km, status, slots }
  })

  // ---- Swap history: 14 days, peaks at commute hours ----
  const historyPool = Array.from({ length: 40 }, () =>
    newBattery({ soc: int(30, 95), status: 'charging', location: pick(stations).id }),
  )
  const peakHours = [7, 8, 8, 9, 9, 10, 12, 13, 17, 18, 18, 19, 19, 20, 21, 15]
  const failureWeights: FailureCode[] = [
    'BATTERY_MISMATCH', 'BATTERY_MISMATCH', 'DOOR_TIMEOUT', 'DOOR_TIMEOUT', 'DOOR_TIMEOUT',
    'SLOT_JAM', 'BATTERY_FAULT', 'COMM_LOST', 'NO_CHARGED_BATTERY', 'RFID_INVALID', 'RFID_BLOCKED',
  ]
  const order: StepKey[] = ['auth', 'collect', 'exchange', 'dispense', 'payment']
  const swaps: Swap[] = []
  const activeStations = stations.filter((s) => s.status !== 'offline' || rand() > 0.5)

  for (let day = 13; day >= 0; day--) {
    const count = day === 0 ? int(7, 10) : int(9, 15)
    for (let k = 0; k < count; k++) {
      const start = new Date(now)
      start.setDate(start.getDate() - day)
      start.setHours(pick(peakHours), int(0, 59), int(0, 59), 0)
      if (start > now) start.setTime(now.getTime() - int(5, 300) * 60_000)

      const customer = pick(customers)
      const station = pick(activeStations)
      const roll = rand()
      const status: Swap['status'] = roll < 0.84 ? 'success' : roll < 0.95 ? 'failed' : 'aborted'
      const failureCode: FailureCode | null =
        status === 'failed' ? pick(failureWeights) : status === 'aborted' ? 'USER_ABORT' : null

      const unknownCard = failureCode === 'RFID_INVALID'
      const cIn: [string, string] = [pick(historyPool), pick(historyPool)]
      const sOut: [string, string] = [pick(historyPool), pick(historyPool)]
      const inSoc: [number, number] = [int(5, 30), int(5, 30)]
      const outSoc: [number, number] = [int(95, 100), int(95, 100)]
      const slotCollect = int(1, 10)
      const slotExchange = ((slotCollect + int(1, 4)) % 10) + 1
      const slotDispense = ((slotExchange + int(0, 3)) % 10) + 1

      const failStep = failureCode
        ? failureCode === 'USER_ABORT'
          ? pick<StepKey>(['collect', 'exchange'])
          : FAILURES[failureCode].step
        : null
      const reached = failStep ? order.indexOf(failStep) : order.length - 1

      let t = start.getTime()
      const steps: SwapStep[] = []
      order.slice(0, reached + 1).forEach((key, idx) => {
        t += idx === 0 ? 4_000 : int(18, 55) * 1000
        const failed = key === failStep
        const base: SwapStep = { key, label: STEP_LABELS[key], at: new Date(t).toISOString(), ok: !failed }
        if (key === 'collect') Object.assign(base, { slot: slotCollect, batteryId: cIn[0] })
        if (key === 'exchange') Object.assign(base, { slot: slotExchange, batteryId: `${sOut[0]} ⇄ ${cIn[1]}` })
        if (key === 'dispense') Object.assign(base, { slot: slotDispense, batteryId: sOut[1] })
        if (failed && failureCode) base.note = FAILURES[failureCode].message
        steps.push(base)
      })

      const success = status === 'success'
      const reachedIdx = (k2: StepKey) => order.indexOf(k2) <= reached
      const bill = success ? swapBill(inSoc, outSoc) : { energyKwh: 0, amount: 0 }
      const isPlan = customer.plan === 'Unlimited monthly'
      const recent = now.getTime() - start.getTime() < 1000 * 60 * 60 * 36

      swaps.push({
        id: makeSwapId(cIn[0], cIn[1], start),
        customerId: unknownCard ? null : customer.id,
        rfid: unknownCard ? `RF-${int(16 ** 7, 16 ** 8 - 1).toString(16).toUpperCase()}` : customer.rfid,
        stationId: station.id,
        startedAt: start.toISOString(),
        endedAt: new Date(t + 3_000).toISOString(),
        status,
        inBatteries: [reachedIdx('collect') ? cIn[0] : null, reachedIdx('exchange') ? cIn[1] : null],
        outBatteries: [success ? sOut[0] : null, success ? sOut[1] : null],
        slots: {
          collect: reachedIdx('collect') ? slotCollect : null,
          exchange: reachedIdx('exchange') ? slotExchange : null,
          dispense: reachedIdx('dispense') ? slotDispense : null,
        },
        steps,
        failure: failureCode
          ? {
              code: failureCode,
              step: failStep!,
              message: FAILURES[failureCode].message,
              resolution: FAILURES[failureCode].resolution,
            }
          : undefined,
        energyKwh: bill.energyKwh,
        amount: isPlan ? 0 : bill.amount,
        payment: !success
          ? 'none'
          : isPlan
            ? 'included'
            : recent && rand() < 0.6
              ? 'pending'
              : rand() < 0.04
                ? 'failed'
                : 'paid',
      })
    }
  }

  const seen = new Set<string>()
  for (const s of swaps) {
    while (seen.has(s.id)) s.id += 'A'
    seen.add(s.id)
  }

  // Blocked customer carries overdue bills
  swaps
    .filter((s) => s.customerId === customers[BLOCKED_INDEX].id && s.status === 'success')
    .forEach((s) => (s.payment = 'pending'))

  // Last successful swap of each customer handed over the batteries now in their bike
  swaps.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  for (const c of customers) {
    const last = swaps.find((s) => s.customerId === c.id && s.status === 'success')
    if (last) {
      last.outBatteries = [...c.batteryIds]
      const dispense = last.steps.find((s) => s.key === 'dispense')
      const exchange = last.steps.find((s) => s.key === 'exchange')
      if (dispense) dispense.batteryId = c.batteryIds[1]
      if (exchange) exchange.batteryId = `${c.batteryIds[0]} ⇄ ${last.inBatteries[1]}`
    }
  }

  return { customers, batteries, stations, swaps }
}
