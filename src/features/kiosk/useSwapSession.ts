import { useCallback, useEffect, useRef, useState } from 'react'
import { FAILURES, STEP_LABELS, makeSwapId, swapBill } from '../../lib/swap'
import { inr } from '../../lib/format'
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

export const DOOR_SECONDS = 45
const TIMEOUT_SECONDS = 9
const FOREIGN_BATTERY = 'ZB-0666'

export type Phase = 'idle' | 'auth' | 'welcome' | 'collect' | 'exchange' | 'dispense' | 'verifying' | 'done' | 'error'
export type Await = 'insert' | 'take' | 'close' | null

export type Session = {
  phase: Phase
  rfid: string
  customer: Customer | null
  plan: { collect: number; exchange: number; dispense: number; sBat1: string; sBat2: string } | null
  /** Battery currently sitting in each box involved in this session */
  contents: Record<number, string | null>
  openBox: number | null
  awaiting: Await
  hands: string[]
  inserted: string[]
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
  plan: null,
  contents: {},
  openBox: null,
  awaiting: null,
  hands: [],
  inserted: [],
  steps: [],
  startedAt: '',
  deadline: 0,
  message: '',
  failure: null,
  result: null,
}

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
    const cBats = c?.batteryIds ?? [null, null]
    const bill =
      success && s.plan && c
        ? swapBill(
            [batteries[c.batteryIds[0]].soc, batteries[c.batteryIds[1]].soc],
            [batteries[s.plan.sBat1].soc, batteries[s.plan.sBat2].soc],
          )
        : { energyKwh: 0, amount: 0 }
    const isPlan = c?.plan === 'Unlimited monthly'
    const reached = (k: StepKey) => steps.some((x) => x.key === k)

    return {
      id: makeSwapId(cBats[0], cBats[1], started),
      customerId: c?.id ?? null,
      rfid: s.rfid,
      stationId: station!.id,
      startedAt: started.toISOString(),
      endedAt: new Date().toISOString(),
      status,
      inBatteries: [s.inserted[0] ?? null, s.inserted[1] ?? null],
      outBatteries: success && s.plan ? [s.plan.sBat1, s.plan.sBat2] : [null, null],
      slots: {
        collect: reached('collect') ? s.plan!.collect : null,
        exchange: reached('exchange') ? s.plan!.exchange : null,
        dispense: reached('dispense') ? s.plan!.dispense : null,
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
      amount: isPlan ? 0 : bill.amount,
      payment: success ? (isPlan ? 'included' : 'pending') : 'none',
    }
  }

  const fail = (code: FailureCode, at: StepKey, extra: Partial<SwapStep> = {}) => {
    clearTimers()
    const steps = [...ref.current.steps, step(at, false, { note: FAILURES[code].message, ...extra })]
    const result = record(code === 'USER_ABORT' ? 'aborted' : 'failed', steps, code)
    commitSwap(result)
    const rejected = code === 'BATTERY_MISMATCH' ? ref.current.inserted.slice(-1) : []
    update({
      phase: 'error',
      hands: [...ref.current.hands, ...rejected],
      steps,
      failure: code,
      result,
      openBox: null,
      awaiting: null,
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

      const empty = station.slots.find((s) => s.state === 'empty')
      const ready = station.slots.filter((s) => s.state === 'ready' && s.batteryId)
      if (!empty || ready.length < 2) return fail('NO_CHARGED_BATTERY', 'auth')

      const plan = {
        collect: empty.no,
        exchange: ready[0].no,
        dispense: ready[1].no,
        sBat1: ready[0].batteryId!,
        sBat2: ready[1].batteryId!,
      }
      const hands = [...customer.batteryIds]
      if (scenarioRef.current === 'mismatch') hands[0] = FOREIGN_BATTERY

      update({
        phase: 'welcome',
        plan,
        hands,
        contents: { [plan.collect]: null, [plan.exchange]: plan.sBat1, [plan.dispense]: plan.sBat2 },
        steps: [step('auth', true, { note: `${customer.name} · ${customer.vehicle.regNo}` })],
        message: 'Preparing your swap…',
      })
      later(startCollect, 2600)
    }, 1300)
  }

  const deadlineFor = () =>
    Date.now() + (scenarioRef.current === 'door-timeout' ? TIMEOUT_SECONDS : DOOR_SECONDS) * 1000

  // ---------- 2. Collect: empty box ← C.Bat1 ----------
  const startCollect = () => {
    const { plan } = ref.current
    update({ phase: 'collect', openBox: plan!.collect, awaiting: 'insert', deadline: deadlineFor(), message: '' })
  }

  // ---------- 3. Exchange: take S.Bat1, insert C.Bat2 ----------
  const startExchange = () => {
    const { plan } = ref.current
    if (scenarioRef.current === 'slot-jam') {
      update({ phase: 'verifying', message: `Opening box ${plan!.exchange}…` })
      later(() => fail('SLOT_JAM', 'exchange', { slot: plan!.exchange }), 1800)
      return
    }
    update({ phase: 'exchange', openBox: plan!.exchange, awaiting: 'take', deadline: deadlineFor(), message: '' })
  }

  // ---------- 4. Dispense: take S.Bat2 ----------
  const startDispense = () => {
    const { plan } = ref.current
    update({ phase: 'dispense', openBox: plan!.dispense, awaiting: 'take', deadline: deadlineFor(), message: '' })
  }

  const complete = () => {
    const s = ref.current
    const draft = record('success', s.steps, null)
    const payNote =
      draft.payment === 'included' ? 'Covered by Unlimited monthly plan' : `${inr(draft.amount)} bill sent to Zeno app`
    const steps = [...s.steps, step('payment', true, { note: payNote })]
    const result = { ...draft, steps, endedAt: new Date().toISOString() }
    commitSwap(result)
    update({ phase: 'done', steps, result, openBox: null, awaiting: null })
  }

  /** Rider puts a battery from their hands into the open box */
  const insert = (batteryId: string) => {
    const s = ref.current
    if (s.awaiting !== 'insert' || s.openBox === null) return
    update({
      contents: { ...s.contents, [s.openBox]: batteryId },
      hands: s.hands.filter((h) => h !== batteryId),
      inserted: [...s.inserted, batteryId],
      awaiting: 'close',
    })
  }

  /** Rider takes the charged battery out of the open box */
  const take = () => {
    const s = ref.current
    if (s.awaiting !== 'take' || s.openBox === null) return
    const id = s.contents[s.openBox]
    if (!id) return
    update({
      contents: { ...s.contents, [s.openBox]: null },
      hands: [...s.hands, id],
      awaiting: s.phase === 'exchange' ? 'insert' : 'close',
    })
  }

  const close = () => {
    const s = ref.current
    if (s.awaiting !== 'close' || !s.plan || !s.customer) return
    if (scenarioRef.current === 'door-timeout') return // simulating a rider who walked away
    const box = s.openBox!
    const phase = s.phase
    update({ openBox: null, awaiting: null, phase: 'verifying' })

    if (phase === 'collect') {
      const id = s.inserted[0]
      update({ message: `Reading battery ID in box ${box}…` })
      later(() => {
        if (!s.customer!.batteryIds.includes(id)) {
          return fail('BATTERY_MISMATCH', 'collect', { slot: box, batteryId: id, note: `${id} is not linked to ${s.rfid}. Door re-opened to return it.` })
        }
        update({ steps: [...ref.current.steps, step('collect', true, { slot: box, batteryId: id })] })
        startExchange()
      }, 1500)
    } else if (phase === 'exchange') {
      const id = s.inserted[1]
      update({ message: `Checking ${id} health & temperature…` })
      later(() => {
        if (!s.customer!.batteryIds.includes(id)) {
          return fail('BATTERY_MISMATCH', 'exchange', { slot: box, batteryId: id, note: `${id} is not linked to ${s.rfid}. Door re-opened to return it.` })
        }
        if (scenarioRef.current === 'battery-fault') {
          return fail('BATTERY_FAULT', 'exchange', { slot: box, batteryId: id, note: `${id} reported 64°C. Battery quarantined.` })
        }
        update({
          steps: [...ref.current.steps, step('exchange', true, { slot: box, batteryId: `${s.plan!.sBat1} ⇄ ${id}` })],
        })
        startDispense()
      }, 1500)
    } else if (phase === 'dispense') {
      update({ message: 'Finalising swap & generating bill…' })
      later(() => {
        if (scenarioRef.current === 'comm-lost') {
          return fail('COMM_LOST', 'dispense', { slot: box, batteryId: s.plan!.sBat2 })
        }
        update({ steps: [...ref.current.steps, step('dispense', true, { slot: box, batteryId: s.plan!.sBat2 })] })
        complete()
      }, 1500)
    }
  }

  const cancel = () => {
    const s = ref.current
    if (!['welcome', 'collect', 'exchange', 'dispense'].includes(s.phase)) return
    const at: StepKey = s.phase === 'welcome' ? 'auth' : (s.phase as StepKey)
    fail('USER_ABORT', at, { slot: s.openBox ?? undefined })
  }

  // Door timeout watchdog
  const [now, setNow] = useState(() => Date.now())
  const active = session.phase === 'collect' || session.phase === 'exchange' || session.phase === 'dispense'
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => {
      setNow(Date.now())
      const s = ref.current
      if (s.deadline && Date.now() > s.deadline) {
        fail('DOOR_TIMEOUT', s.phase as StepKey, { slot: s.openBox ?? undefined, note: `Box ${s.openBox} door not closed in time.` })
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [active])

  const secondsLeft = active ? Math.max(0, Math.ceil((session.deadline - now) / 1000)) : 0

  return { session, secondsLeft, tap, insert, take, close, cancel, reset }
}
