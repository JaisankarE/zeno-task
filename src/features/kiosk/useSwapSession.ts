import { useCallback, useEffect, useRef, useState } from 'react'
import { FAILURES, STEP_LABELS, makeSwapId, swapBill, swapDoors, type Door } from '../../lib/swap'
import { inr } from '../../lib/format'
import { config } from '../../config'
import { useZenoStore } from '../../stores/useZenoStore'
import type { Customer, FailureCode, Station, StepKey, Swap, SwapStep } from '../../types'

export type Scenario = 'normal' | 'mismatch' | 'door-timeout' | 'slot-jam' | 'battery-fault' | 'comm-lost'

export const SCENARIOS: Array<{ value: Scenario; label: string; hint: string }> = [
  { value: 'normal', label: 'Happy path', hint: 'Everything works' },
  { value: 'mismatch', label: 'Wrong battery', hint: 'Rider inserts a pack not linked to the RFID' },
  { value: 'door-timeout', label: 'Door left open', hint: 'Rider walks away — door timeout' },
  { value: 'slot-jam', label: 'Slot jam', hint: 'Exchange box actuator fails' },
  { value: 'battery-fault', label: 'Overheated pack', hint: 'Returned battery reports 64°C' },
  { value: 'comm-lost', label: 'Network loss', hint: 'Cloud link drops at dispense' },
]

/** true: one tap opens every swap door together. false: Collect → Exchange → Dispense, one door at a time */
export const OPEN_ALL_DOORS = config.openAllDoors
/** Countdown for one door, or for all doors together when OPEN_ALL_DOORS is on */
export const DOOR_SECONDS = OPEN_ALL_DOORS ? config.allDoorsSeconds : config.doorSeconds
const TIMEOUT_SECONDS = config.doorTimeoutDemoSeconds
const PACKS = config.batteriesPerBike
const FOREIGN_BATTERY = 'ZB-0666'
/** The "Slot jam" scenario jams the first door after Collect */
const JAM_DOOR = 1

export type Phase =
  | 'idle'
  | 'auth'
  | 'welcome'
  | 'collect'
  | 'exchange'
  | 'dispense'
  | 'all-doors'
  | 'verifying'
  | 'done'
  | 'error'
export type Await = 'insert' | 'take' | 'close'
/** What the rider must do next at a box; 'closed' = door shut, waiting for the other doors */
export type BoxTask = Await | 'closed'

export type Session = {
  phase: Phase
  rfid: string
  customer: Customer | null
  /** Doors this swap uses: Collect, Exchange × (batteries − 1), Dispense */
  doors: Door[]
  /** Door being worked on in one-door-at-a-time mode */
  doorIndex: number
  /** Boxes whose door has been opened during this session */
  opened: number[]
  /** Battery currently sitting in each box involved in this session */
  contents: Record<number, string | null>
  /** Open boxes and what the rider has to do at each */
  tasks: Record<number, BoxTask>
  /** Customer battery put into each box */
  insertedInto: Record<number, string>
  hands: string[]
  steps: SwapStep[]
  startedAt: string
  deadline: number
  message: string
  failure: FailureCode | null
  result: Swap | null
}

const initial: Session = {
  phase: 'idle',
  rfid: '',
  customer: null,
  doors: [],
  doorIndex: 0,
  opened: [],
  contents: {},
  tasks: {},
  insertedInto: {},
  hands: [],
  steps: [],
  startedAt: '',
  deadline: 0,
  message: '',
  failure: null,
  result: null,
}

/** Boxes whose door is open right now, in swap order */
export const openBoxes = (s: Session) =>
  s.doors.filter((d) => s.tasks[d.box] !== undefined && s.tasks[d.box] !== 'closed').map((d) => d.box)

/** Charged batteries the station hands out in this session */
export const stationPacks = (s: Session) => s.doors.flatMap((d) => (d.take ? [d.take] : []))

const firstTask = (door: Door): Await => (door.key === 'collect' ? 'insert' : 'take')

export function useSwapSession(station: Station | undefined, scenario: Scenario) {
  const customers = useZenoStore((s) => s.customers)
  const batteries = useZenoStore((s) => s.batteries)
  const commitSwap = useZenoStore((s) => s.commitSwap)

  const [session, setSession] = useState<Session>(initial)
  const ref = useRef(session)
  const timers = useRef<number[]>([])
  const scenarioRef = useRef(scenario)
  useEffect(() => {
    scenarioRef.current = scenario
  }, [scenario])

  const update = useCallback((patch: Partial<Session>) => {
    ref.current = { ...ref.current, ...patch }
    setSession(ref.current)
  }, [])

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  useEffect(() => clearTimers, [])

  const step = (key: StepKey, ok: boolean, extra: Partial<SwapStep> = {}): SwapStep => ({
    key,
    label: STEP_LABELS[key],
    at: new Date().toISOString(),
    ok,
    ...extra,
  })

  const record = (status: Swap['status'], steps: SwapStep[], failure: FailureCode | null): Swap => {
    const s = ref.current
    const c = s.customer
    const started = new Date(s.startedAt || Date.now())
    const success = status === 'success'
    const out = stationPacks(s)
    const bill =
      success && c
        ? swapBill(
            c.batteryIds.map((id) => batteries[id].soc),
            out.map((id) => batteries[id].soc),
          )
        : { energyKwh: 0, amount: 0 }
    const insertDoors = s.doors.filter((d) => d.key !== 'dispense')
    const used = (box: number | undefined) => (box !== undefined && s.opened.includes(box) ? box : null)

    return {
      id: makeSwapId(c?.batteryIds ?? [], started),
      customerId: c?.id ?? null,
      rfid: s.rfid,
      stationId: station!.id,
      startedAt: started.toISOString(),
      endedAt: new Date().toISOString(),
      status,
      inBatteries: Array.from({ length: PACKS }, (_, j) => s.insertedInto[insertDoors[j]?.box] ?? null),
      outBatteries: Array.from({ length: PACKS }, (_, j) => (success ? (out[j] ?? null) : null)),
      slots: {
        collect: used(s.doors.find((d) => d.key === 'collect')?.box),
        exchange: s.doors.filter((d) => d.key === 'exchange' && s.opened.includes(d.box)).map((d) => d.box),
        dispense: used(s.doors.find((d) => d.key === 'dispense')?.box),
      },
      steps,
      failure: failure
        ? {
            code: failure,
            step: steps[steps.length - 1]?.key ?? 'auth',
            message: FAILURES[failure].message,
            resolution: FAILURES[failure].resolution,
          }
        : undefined,
      energyKwh: bill.energyKwh,
      amount: bill.amount,
      payment: success ? 'pending' : 'none',
    }
  }

  const fail = (code: FailureCode, at: StepKey, extra: Partial<SwapStep> = {}) => {
    clearTimers()
    const steps = [...ref.current.steps, step(at, false, { note: FAILURES[code].message, ...extra })]
    const result = record(code === 'USER_ABORT' ? 'aborted' : 'failed', steps, code)
    commitSwap(result)
    // The rejected battery comes back out of its box
    const rejected = code === 'BATTERY_MISMATCH' && extra.batteryId ? [extra.batteryId] : []
    update({
      phase: 'error',
      hands: [...ref.current.hands, ...rejected],
      steps,
      failure: code,
      result,
      tasks: {},
      message: FAILURES[code].resolution,
    })
  }

  const reset = useCallback(() => {
    clearTimers()
    ref.current = initial
    setSession(initial)
  }, [])

  // ---------- 1. RFID tap ----------
  const tap = (rfid: string) => {
    if (!station || ref.current.phase !== 'idle') return
    clearTimers()
    const startedAt = new Date().toISOString()
    update({ ...initial, phase: 'auth', rfid, startedAt, message: 'Verifying RFID card…' })

    later(() => {
      const customer = customers.find((c) => c.rfid === rfid) ?? null
      update({ customer })
      if (!customer) return fail('RFID_INVALID', 'auth')
      if (customer.status === 'blocked') return fail('RFID_BLOCKED', 'auth')

      // One empty box for C.Bat1 + one charged battery per pack in the bike
      const empty = station.slots.find((s) => s.state === 'empty')
      const ready = station.slots.filter((s) => s.state === 'ready' && s.batteryId)
      if (!empty || ready.length < PACKS) return fail('NO_CHARGED_BATTERY', 'auth')

      const doors = swapDoors(
        empty.no,
        ready.slice(0, PACKS).map((s) => ({ box: s.no, batteryId: s.batteryId! })),
      )
      const hands = [...customer.batteryIds]
      if (scenarioRef.current === 'mismatch') hands[0] = FOREIGN_BATTERY

      update({
        phase: 'welcome',
        doors,
        hands,
        contents: Object.fromEntries(doors.map((d) => [d.box, d.take])),
        steps: [step('auth', true, { note: `${customer.name} · ${customer.vehicle.regNo}` })],
        message: 'Preparing your swap…',
      })
      later(OPEN_ALL_DOORS ? openAllDoors : () => openDoor(0), config.welcomeScreenMs)
    }, config.rfidVerifyMs)
  }

  const deadlineFor = () =>
    Date.now() + (scenarioRef.current === 'door-timeout' ? TIMEOUT_SECONDS : DOOR_SECONDS) * 1000

  const jam = (door: Door) => {
    update({ phase: 'verifying', opened: [...ref.current.opened, door.box], message: `Opening box ${door.box}…` })
    later(() => fail('SLOT_JAM', door.key, { slot: door.box }), 1800)
  }

  // ---------- 2a. One door at a time: Collect → Exchange… → Dispense ----------
  const openDoor = (i: number) => {
    const s = ref.current
    const door = s.doors[i]
    if (scenarioRef.current === 'slot-jam' && i === JAM_DOOR) return jam(door)
    update({
      phase: door.key,
      doorIndex: i,
      opened: [...s.opened, door.box],
      tasks: { [door.box]: firstTask(door) },
      deadline: deadlineFor(),
      message: '',
    })
  }

  // ---------- 2b. All doors at once ----------
  const openAllDoors = () => {
    const { doors } = ref.current
    if (scenarioRef.current === 'slot-jam') return jam(doors[JAM_DOOR])
    update({
      phase: 'all-doors',
      opened: doors.map((d) => d.box),
      tasks: Object.fromEntries(doors.map((d) => [d.box, firstTask(d)])),
      deadline: deadlineFor(),
      message: '',
    })
  }

  const complete = () => {
    const s = ref.current
    const draft = record('success', s.steps, null)
    const payNote = `${inr(draft.amount)} bill sent to Zeno app · pay from the rider portal`
    const steps = [...s.steps, step('payment', true, { note: payNote })]
    const result = { ...draft, steps, endedAt: new Date().toISOString() }
    commitSwap(result)
    update({ phase: 'done', steps, result, tasks: {} })
  }

  /** First open box waiting for the given action */
  const boxAwaiting = (task: Await) => ref.current.doors.find((d) => ref.current.tasks[d.box] === task)?.box

  /** Rider puts a battery from their hands into an open box (the first one waiting for it by default) */
  const insert = (batteryId: string, box = boxAwaiting('insert')) => {
    const s = ref.current
    if (box === undefined || s.tasks[box] !== 'insert') return
    update({
      contents: { ...s.contents, [box]: batteryId },
      hands: s.hands.filter((h) => h !== batteryId),
      insertedInto: { ...s.insertedInto, [box]: batteryId },
      tasks: { ...s.tasks, [box]: 'close' },
    })
  }

  /** Rider takes the charged battery out of an open box */
  const take = (box: number) => {
    const s = ref.current
    if (s.tasks[box] !== 'take') return
    const id = s.contents[box]
    const door = s.doors.find((d) => d.box === box)
    if (!id || !door) return
    update({
      contents: { ...s.contents, [box]: null },
      hands: [...s.hands, id],
      tasks: { ...s.tasks, [box]: door.key === 'exchange' ? 'insert' : 'close' },
    })
  }

  const checkingMessage = (door: Door) =>
    door.key === 'collect'
      ? `Reading battery ID in box ${door.box}…`
      : door.key === 'exchange'
        ? `Checking ${ref.current.insertedInto[door.box]} health & temperature…`
        : 'Finalising swap & generating bill…'

  /** Station checks for one closed door. Records the step, or fails the session and returns false. */
  const verifyDoor = (i: number): boolean => {
    const s = ref.current
    const door = s.doors[i]
    const slot = door.box
    const id = s.insertedInto[slot]

    if (door.key === 'dispense') {
      if (scenarioRef.current === 'comm-lost') {
        fail('COMM_LOST', 'dispense', { slot, batteryId: door.take! })
        return false
      }
    } else {
      if (!s.customer!.batteryIds.includes(id)) {
        const putBack = OPEN_ALL_DOORS ? ' Charged batteries must be returned to their boxes.' : ''
        fail('BATTERY_MISMATCH', door.key, {
          slot,
          batteryId: id,
          note: `${id} is not linked to ${s.rfid}. Door re-opened to return it.${putBack}`,
        })
        return false
      }
      // The last returned battery is the one that reports overheating
      if (scenarioRef.current === 'battery-fault' && i === s.doors.length - 2) {
        fail('BATTERY_FAULT', door.key, { slot, batteryId: id, note: `${id} reported 64°C. Battery quarantined.` })
        return false
      }
    }

    const batteryId = door.key === 'collect' ? id : door.key === 'exchange' ? `${door.take} ⇄ ${id}` : door.take!
    update({ steps: [...ref.current.steps, step(door.key, true, { slot, batteryId })] })
    return true
  }

  const close = (box: number) => {
    const s = ref.current
    if (s.tasks[box] !== 'close' || !s.customer) return
    if (scenarioRef.current === 'door-timeout') return // simulating a rider who walked away

    if (OPEN_ALL_DOORS) {
      const tasks: Record<number, BoxTask> = { ...s.tasks, [box]: 'closed' }
      update({ tasks })
      if (!Object.values(tasks).every((t) => t === 'closed')) return
      // Every door shut: lock them all and check the whole swap in one go
      update({ phase: 'verifying', tasks: {}, message: 'All doors locked · checking batteries…' })
      later(() => {
        if (s.doors.every((_, i) => verifyDoor(i))) complete()
      }, config.batteryCheckMs)
      return
    }

    const i = s.doorIndex
    update({ phase: 'verifying', tasks: {}, message: checkingMessage(s.doors[i]) })
    later(() => {
      if (!verifyDoor(i)) return
      if (i + 1 < s.doors.length) openDoor(i + 1)
      else complete()
    }, config.batteryCheckMs)
  }

  const cancel = () => {
    const s = ref.current
    if (!['welcome', 'collect', 'exchange', 'dispense', 'all-doors'].includes(s.phase)) return
    const door = s.doors.find((d) => openBoxes(s).includes(d.box))
    const at: StepKey = s.phase === 'welcome' ? 'auth' : (door?.key ?? 'collect')
    fail('USER_ABORT', at, { slot: door?.box })
  }

  // Door timeout watchdog
  const [now, setNow] = useState(() => Date.now())
  const active = ['collect', 'exchange', 'dispense', 'all-doors'].includes(session.phase)
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => {
      setNow(Date.now())
      const s = ref.current
      if (s.deadline && Date.now() > s.deadline) {
        const open = openBoxes(s)
        const door = s.doors.find((d) => d.box === open[0])
        fail('DOOR_TIMEOUT', door?.key ?? 'collect', {
          slot: door?.box,
          note: `Box ${open.join(', ')} door${open.length > 1 ? 's' : ''} not closed in time.`,
        })
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [active])

  const secondsLeft = active ? Math.max(0, Math.ceil((session.deadline - now) / 1000)) : 0

  return { session, secondsLeft, tap, insert, take, close, cancel, reset }
}
