import type { ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import { ZDiamond } from '../../components/Logo'
import { cx } from '../../lib/cx'
import { inr } from '../../lib/format'
import { FAILURES } from '../../lib/swap'
import type { Battery, Station } from '../../types'
import { config } from '../../config'
import { DOOR_SECONDS, OPEN_ALL_DOORS, type Session } from './useSwapSession'

/** Everything here is sized in container-query units so it scales with the machine */
export function KioskScreen({
  station,
  session,
  batteries,
  secondsLeft,
  onCancel,
  onFinish,
}: {
  station: Station
  session: Session
  batteries: Record<string, Battery>
  secondsLeft: number
  onCancel: () => void
  onFinish: () => void
}) {
  const { phase, customer, doors } = session
  const countdown = (
    <div className="flex items-center gap-[2cqw]">
      <div className="h-[1.2cqw] flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={cx('h-full rounded-full transition-[width] duration-300', secondsLeft <= 10 ? 'bg-rose-500' : 'bg-white/40')}
          style={{ width: `${Math.min(100, (secondsLeft / DOOR_SECONDS) * 100)}%` }}
        />
      </div>
      <span className={cx('w-[8cqw] text-right font-mono text-[2.8cqw]', secondsLeft <= 10 ? 'text-rose-400' : 'text-white/50')}>
        {secondsLeft}s
      </span>
      <button
        onClick={onCancel}
        className="rounded-[1.5cqw] border border-white/15 px-[2.4cqw] py-[1cqw] text-[2.6cqw] font-semibold text-white/70 hover:bg-white/10"
      >
        Cancel
      </button>
    </div>
  )

  if (station.status !== 'online') {
    return (
      <Center>
        <span className="grid size-[14cqw] place-items-center rounded-full bg-amber-500/15 text-amber-400">
          <Icon name="wrench" className="size-[7cqw]" />
        </span>
        <p className="mt-[3cqw] text-[5.2cqw] font-bold text-white">Out of service</p>
        <p className="mt-[1cqw] text-[3.2cqw] text-white/50">
          {station.status === 'maintenance' ? 'Scheduled maintenance in progress' : 'Station offline'}
        </p>
      </Center>
    )
  }

  if (phase === 'idle') {
    const ready = station.slots.filter((s) => s.state === 'ready').length
    return (
      <Center className="bg-[radial-gradient(circle_at_50%_0%,rgb(18_184_134/0.25),transparent_60%)]">
        <ZDiamond className="size-[11cqw] text-zeno-400" strokeWidth={7} />
        <p className="mt-[3cqw] font-display text-[6cqw] font-bold leading-tight text-white">Tap your RFID card</p>
        <p className="mt-[1.2cqw] text-[3.2cqw] text-white/55">Hold the card on the reader to start a swap</p>
        <div className="mt-[4cqw] flex items-center gap-[2cqw] rounded-full bg-white/5 px-[3cqw] py-[1.3cqw] text-[2.8cqw] text-white/70">
          <span className="size-[1.6cqw] rounded-full bg-zeno-400" />
          {ready} charged batteries · {station.name}
        </div>
        <Icon name="arrowRight" className="absolute right-[2cqw] top-[24cqw] size-[6cqw] text-zeno-400 animate-pulse" />
      </Center>
    )
  }

  if (phase === 'auth') {
    return (
      <Center>
        <Spinner />
        <p className="mt-[4cqw] text-[4.4cqw] font-semibold text-white">Verifying card…</p>
        <p className="mt-[1cqw] font-mono text-[3cqw] text-white/50">{session.rfid}</p>
      </Center>
    )
  }

  if (phase === 'welcome' && customer && doors.length) {
    return (
      <div className="flex h-full flex-col p-[4cqw] animate-fade-in">
        <p className="text-[3cqw] text-white/50">Welcome back</p>
        <p className="font-display text-[6.4cqw] font-bold leading-tight text-white">{customer.name}</p>
        <p className="text-[2.8cqw] text-white/40">
          {customer.vehicle.model} · {customer.vehicle.regNo}
        </p>
        <div className="mt-[3cqw] grid grid-cols-2 gap-[2cqw]">
          {customer.batteryIds.map((id, i) => (
            <div key={id} className="rounded-[2cqw] bg-white/5 p-[2.4cqw]">
              <p className="text-[2.6cqw] text-white/40">Battery {i + 1}</p>
              <p className="text-[5cqw] font-bold text-rose-400">{batteries[id].soc}%</p>
              <p className="font-mono text-[2.4cqw] text-white/40">{id}</p>
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between text-[2.8cqw] text-white/60">
          <span>
            {OPEN_ALL_DOORS ? 'Opening boxes ' : 'Boxes '}
            {doors.map((d, i) => (
              <span key={d.box}>
                {i > 0 && (OPEN_ALL_DOORS ? ', ' : ' → ')}
                <b className="text-white">{d.box}</b>
              </span>
            ))}
          </span>
          <span className="flex items-center gap-[1cqw]">
            <span className="size-[3cqw] animate-spin rounded-full border-2 border-zeno-400 border-r-transparent" /> Preparing
          </span>
        </div>
      </div>
    )
  }

  // ---------- One door at a time ----------
  if ((phase === 'collect' || phase === 'exchange' || phase === 'dispense') && customer) {
    const idx = session.doorIndex
    const door = doors[idx]
    const box = door.box
    const task = session.tasks[box]
    const packs = config.batteriesPerBike
    let title = `Close Box ${box}`
    let body = 'Push the door shut to continue'
    if (task === 'insert') {
      title = `Insert battery ${idx + 1} in Box ${box}`
      body = idx === 0 ? 'Put one of your drained batteries in the open box' : 'Put your next drained battery in the same box'
    } else if (task === 'take') {
      title = phase === 'dispense' ? `Collect battery ${packs} from Box ${box}` : `Collect charged battery from Box ${box}`
      body = `Take ${door.take} (${batteries[door.take!].soc}%)`
    } else if (phase === 'dispense') {
      body = 'Last step — push the door shut'
    }

    return (
      <div className="flex h-full flex-col p-[3.6cqw] animate-fade-in">
        <div className="flex items-center gap-[1.4cqw]">
          {doors.map((d, i) => (
            <div key={d.box} className="flex flex-1 flex-col gap-[0.8cqw]">
              <div className={cx('h-[1cqw] rounded-full', i < idx ? 'bg-zeno-500' : i === idx ? 'bg-zeno-400 animate-pulse' : 'bg-white/10')} />
              <span className={cx('truncate text-[2.4cqw] font-semibold uppercase tracking-wider', i <= idx ? 'text-zeno-300' : 'text-white/30')}>
                {i + 1}. {d.key}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-[3cqw] flex flex-1 items-center gap-[3cqw]">
          <div className="grid size-[19cqw] shrink-0 place-items-center rounded-[3cqw] bg-zeno-500 text-white shadow-[0_0_30px_rgb(18_184_134/0.5)]">
            <div className="text-center leading-none">
              <p className="text-[2.4cqw] font-semibold uppercase opacity-80">Box</p>
              <p className="font-display text-[10cqw] font-bold">{box}</p>
            </div>
          </div>
          <div className="min-w-0" key={`${idx}-${task}`}>
            <p className="font-display text-[5cqw] font-bold leading-tight text-white animate-fade-up">{title}</p>
            <p className="mt-[1.2cqw] text-[3cqw] leading-snug text-white/55">{body}</p>
          </div>
        </div>

        {countdown}
      </div>
    )
  }

  // ---------- All doors open together ----------
  if (phase === 'all-doors' && customer) {
    const done = doors.filter((d) => session.tasks[d.box] === 'closed').length
    const todo = (d: (typeof doors)[number]) => {
      const task = session.tasks[d.box]
      if (task === 'closed') return 'Closed'
      if (task === 'take') return `Take ${d.take?.replace('ZB-', '#')}`
      if (task === 'insert') return 'Insert yours'
      return 'Close door'
    }

    return (
      <div className="flex h-full flex-col p-[3.6cqw] animate-fade-in">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-[5cqw] font-bold leading-tight text-white">All doors open</p>
          <p className="text-[2.8cqw] text-white/50">
            {done}/{doors.length} closed
          </p>
        </div>
        <p className="mt-[0.6cqw] text-[2.8cqw] text-white/55">Swap your batteries in any order, then close every door</p>

        <div className="mt-[2.4cqw] grid flex-1 gap-[1.6cqw]" style={{ gridTemplateColumns: `repeat(${doors.length}, minmax(0, 1fr))` }}>
          {doors.map((d) => {
            const closed = session.tasks[d.box] === 'closed'
            return (
              <div
                key={d.box}
                className={cx(
                  'flex flex-col items-center justify-center rounded-[2cqw] p-[1.4cqw] text-center',
                  closed ? 'bg-zeno-500/20 text-zeno-200' : 'bg-white/5 text-white',
                )}
              >
                <p className="text-[2.2cqw] font-semibold uppercase tracking-wider opacity-60">{d.key}</p>
                <p className="font-display text-[8cqw] font-bold leading-none">{d.box}</p>
                <p className={cx('mt-[0.8cqw] flex items-center gap-[0.6cqw] text-[2.4cqw] font-semibold', !closed && 'text-zeno-300')}>
                  {closed && <Icon name="check" className="size-[2.6cqw]" />}
                  {todo(d)}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-[2.4cqw]">{countdown}</div>
      </div>
    )
  }

  if (phase === 'verifying') {
    return (
      <Center>
        <Spinner />
        <p className="mt-[4cqw] px-[4cqw] text-[4cqw] font-semibold text-white">{session.message}</p>
        <p className="mt-[1cqw] text-[2.8cqw] text-white/40">Please wait, door locked</p>
      </Center>
    )
  }

  if (phase === 'done' && session.result) {
    const r = session.result
    return (
      <div className="flex h-full flex-col items-center justify-center p-[4cqw] text-center animate-scale-in">
        <span className="relative grid size-[14cqw] place-items-center rounded-full bg-zeno-500 text-white">
          <span className="absolute inset-0 rounded-full bg-zeno-400 animate-pulse-ring" />
          <Icon name="check" className="relative size-[7cqw]" />
        </span>
        <p className="mt-[2.4cqw] font-display text-[6cqw] font-bold text-white">Swap complete!</p>
        <p className="font-mono text-[2.6cqw] text-white/50">{r.id}</p>
        <div className="mt-[2.4cqw] flex gap-[2cqw]">
          {r.outBatteries.map((id, i) => (
            <span key={id ?? i} className="rounded-[1.5cqw] bg-white/5 px-[2.4cqw] py-[1cqw] text-[2.8cqw] text-white/80">
              <b className="text-zeno-300">{id && batteries[id]?.soc}%</b> {id}
            </span>
          ))}
        </div>
        <p className="mt-[2.4cqw] text-[3cqw] text-white/70">
          Bill <b className="text-white">{inr(r.amount)}</b> sent to your Zeno app — pay from the rider portal
        </p>
        <button onClick={onFinish} className="mt-[3cqw] rounded-[1.5cqw] bg-white px-[4cqw] py-[1.4cqw] text-[3cqw] font-bold text-ink-900">
          Done
        </button>
      </div>
    )
  }

  if (phase === 'error' && session.failure) {
    const f = FAILURES[session.failure]
    return (
      <div className="flex h-full flex-col items-center justify-center p-[4cqw] text-center animate-shake">
        <span className="grid size-[13cqw] place-items-center rounded-full bg-rose-500/15 text-rose-400">
          <Icon name="alert" className="size-[7cqw]" />
        </span>
        <p className="mt-[2.4cqw] font-display text-[5.4cqw] font-bold text-white">{f.title}</p>
        <p className="mt-[1cqw] text-[3cqw] leading-snug text-white/60">{f.message}</p>
        <p className="mt-[1.6cqw] rounded-[1.5cqw] bg-white/5 px-[3cqw] py-[1.2cqw] text-[2.6cqw] text-white/50">{f.resolution}</p>
        <button onClick={onFinish} className="mt-[3cqw] rounded-[1.5cqw] bg-white px-[4cqw] py-[1.4cqw] text-[3cqw] font-bold text-ink-900">
          Back to start
        </button>
      </div>
    )
  }

  return null
}

function Center({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('relative flex h-full flex-col items-center justify-center p-[4cqw] text-center animate-fade-in', className)}>
      {children}
    </div>
  )
}

function Spinner() {
  return <span className="size-[11cqw] animate-spin rounded-full border-[1.2cqw] border-white/10 border-t-zeno-400" />
}
