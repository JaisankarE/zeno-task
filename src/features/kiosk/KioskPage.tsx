import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import { Logo, ZDiamond } from '../../components/Logo'
import { StationStatusBadge } from '../../components/StatusBadges'
import { SwapTimeline } from '../../components/SwapTimeline'
import { cx } from '../../lib/cx'
import { socTone } from '../../lib/format'
import { Link } from '../../components/Link'
import { navigate } from '../../lib/router'
import { useZenoStore } from '../../stores/useZenoStore'
import type { Battery } from '../../types'
import { KioskMachine, type BoxView } from './KioskMachine'
import { KioskScreen } from './KioskScreen'
import { SCENARIOS, useSwapSession, type Scenario } from './useSwapSession'

const UNKNOWN_RFID = 'RF-DEADBEEF'

export function KioskPage({ stationId, riderId }: { stationId?: string; riderId?: string }) {
  const stations = useZenoStore((s) => s.stations)
  const customers = useZenoStore((s) => s.customers)
  const batteries = useZenoStore((s) => s.batteries)
  const tickCharging = useZenoStore((s) => s.tickCharging)
  const station = stations.find((s) => s.id === stationId) ?? stations[0]
  const [scenario, setScenario] = useState<Scenario>('normal')
  const { session, secondsLeft, tap, insert, take, close, cancel, reset } = useSwapSession(station, scenario)

  const idle = session.phase === 'idle'
  const finished = session.phase === 'done' || session.phase === 'error'

  // Docked batteries keep charging while the kiosk is open
  useEffect(() => {
    const id = window.setInterval(() => tickCharging(station.id), 2500)
    return () => window.clearInterval(id)
  }, [station.id, tickCharging])

  // Return to the start screen a while after a session ends
  useEffect(() => {
    if (!finished) return
    const id = window.setTimeout(reset, 25000)
    return () => window.clearTimeout(id)
  }, [finished, reset])

  // Switching station resets any running session
  useEffect(() => reset, [station.id, reset])

  const lookup = (id: string): Battery =>
    batteries[id] ?? { id, soc: 17, health: 61, cycles: 990, tempC: 33, status: 'in-vehicle', location: 'unknown' }

  const isStationPack = (id: string) => id === session.plan?.sBat1 || id === session.plan?.sBat2
  const insertable = session.hands.filter((h) => !isStationPack(h))

  const boxes: BoxView[] = station.slots.map((slot) => {
    const inSession = session.plan !== null && slot.no in session.contents
    const batteryId = inSession ? session.contents[slot.no] : slot.batteryId
    const open = session.openBox === slot.no
    let action: BoxView['action'] = null
    if (open) {
      if (session.awaiting === 'insert' && insertable[0]) {
        action = { label: `Insert ${insertable[0].replace('ZB-', '#')}`, onClick: () => insert(insertable[0]) }
      } else if (session.awaiting === 'take') {
        action = { label: 'Take battery', onClick: take }
      } else if (session.awaiting === 'close') {
        action =
          scenario === 'door-timeout'
            ? { label: 'Rider left…', onClick: () => {} }
            : { label: 'Close door', onClick: close }
      }
    }
    return {
      no: slot.no,
      state: inSession ? (batteryId ? (isStationPack(batteryId) ? 'ready' : 'charging') : 'empty') : slot.state,
      battery: batteryId ? lookup(batteryId) : null,
      open,
      target: open,
      action,
    }
  })

  const cardList = [...customers].sort((a, b) => Number(b.city === station.city) - Number(a.city === station.city))
  // Opened from the rider portal: only this rider's card is in hand
  const rider = riderId ? customers.find((c) => c.id === riderId) : undefined
  const canTap = idle && station.status === 'online'

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-5 py-3">
          <Link to="/">
            <Logo subtitle="Station Kiosk Simulator" />
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value={station.id}
              onChange={(e) => navigate(`/kiosk/${e.target.value}`)}
              className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-zeno-400"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id} className="bg-ink-900">
                  {s.name} · {s.id}
                </option>
              ))}
            </select>
            <StationStatusBadge status={station.status} />
            <Link to="/admin/swaps" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
              Admin records
            </Link>
            <Link to="/rider" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
              Rider portal
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-6 px-5 py-8 xl:grid-cols-[1fr_400px]">
        {/* Machine stage */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/5 bg-[radial-gradient(ellipse_at_50%_20%,#1f2a3d,#0a111f_70%)] px-4 pb-6 pt-8 sm:px-10">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="relative mb-6 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zeno-400">{station.id}</p>
              <h1 className="font-display text-2xl font-bold">{station.name}</h1>
              <p className="text-xs text-slate-400">{station.area}, {station.city}</p>
            </div>
            <div className="flex gap-3 text-[11px] text-slate-400">
              {[
                ['bg-emerald-400', 'Ready'],
                ['bg-amber-400', 'Charging'],
                ['bg-slate-500', 'Empty'],
                ['bg-rose-500', 'Faulty'],
              ].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className={cx('size-2 rounded-full', c)} /> {l}
                </span>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up">
            <KioskMachine
              boxes={boxes}
              readerActive={idle && station.status === 'online'}
              onReaderClick={() => {
                if (rider && canTap) tap(rider.rfid)
                else if (idle) document.getElementById('card-reader')?.scrollIntoView({ behavior: 'smooth' })
              }}
              screen={
                <KioskScreen
                  station={station}
                  session={session}
                  batteries={batteries}
                  secondsLeft={secondsLeft}
                  onCancel={cancel}
                  onFinish={reset}
                />
              }
            />
          </div>

          <p className="relative mt-4 text-center text-xs text-slate-500">
            Flow: <b className="text-slate-300">Collect</b> (empty box ← C.Bat1) → <b className="text-slate-300">Exchange</b> (take S.Bat1, insert C.Bat2) →{' '}
            <b className="text-slate-300">Dispense</b> (take S.Bat2) → bill to rider app
          </p>
        </section>

        {/* Simulator controls */}
        <aside className="space-y-4">
          {rider ? (
            <Panel id="card-reader" step="1" title="Your RFID card" subtitle={idle ? 'Tap it on the reader to start your swap' : 'Session in progress'}>
              <RiderCard
                name={rider.name}
                rfid={rider.rfid}
                vehicle={`${rider.vehicle.model} · ${rider.vehicle.regNo}`}
                socs={rider.batteryIds.map((id) => batteries[id].soc)}
                blocked={rider.status === 'blocked'}
                active={!idle}
              />
              <button
                disabled={!canTap}
                onClick={() => tap(rider.rfid)}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zeno-500 text-sm font-semibold shadow-lg shadow-zeno-500/25 transition hover:bg-zeno-400 disabled:bg-white/10 disabled:text-slate-400 disabled:shadow-none"
              >
                <Icon name="nfc" /> {idle ? 'Tap card on reader' : 'Card verified'}
              </button>
              <Link to="/rider" className="mt-3 flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white">
                <Icon name="chevronLeft" className="size-3" /> Back to my dashboard
              </Link>
            </Panel>
          ) : (
          <Panel id="card-reader" step="1" title="Tap an RFID card" subtitle={idle ? 'Pick a rider to start a session' : 'Session in progress'}>
            <div className="scrollbar-thin -mx-1 max-h-[268px] space-y-1.5 overflow-y-auto px-1">
              {cardList.map((c) => {
                const [b1, b2] = c.batteryIds.map((id) => batteries[id])
                const low = Math.min(b1.soc, b2.soc)
                const active = session.rfid === c.rfid && !idle
                return (
                  <button
                    key={c.id}
                    disabled={!idle || station.status !== 'online'}
                    onClick={() => tap(c.rfid)}
                    className={cx(
                      'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition',
                      active ? 'border-zeno-400/60 bg-zeno-400/10' : 'border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]',
                      !idle && !active && 'opacity-40',
                    )}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 text-zeno-300">
                      <Icon name="nfc" className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{c.name}</span>
                      <span className="block font-mono text-[10px] text-slate-400">{c.rfid}</span>
                    </span>
                    {c.status === 'blocked' ? (
                      <span className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">BLOCKED</span>
                    ) : (
                      <span className={cx('text-xs font-bold font-tabular', socTone(low) === 'low' ? 'text-rose-400' : socTone(low) === 'mid' ? 'text-amber-300' : 'text-zeno-300')}>
                        {b1.soc}% · {b2.soc}%
                      </span>
                    )}
                  </button>
                )
              })}
              <button
                disabled={!idle || station.status !== 'online'}
                onClick={() => tap(UNKNOWN_RFID)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-xl border border-dashed border-rose-400/30 px-3 py-2 text-left transition hover:bg-rose-500/5',
                  !idle && 'opacity-40',
                )}
              >
                <span className="grid size-8 place-items-center rounded-lg bg-rose-500/10 text-rose-300">
                  <Icon name="card" className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-rose-200">Unregistered card</span>
                  <span className="block font-mono text-[10px] text-slate-500">{UNKNOWN_RFID}</span>
                </span>
              </button>
            </div>
          </Panel>
          )}

          <Panel step="2" title="Rider's hands" subtitle={handsHint(session.awaiting, insertable.length > 0)}>
            {session.hands.length === 0 ? (
              <p className="rounded-xl bg-white/[0.03] px-3 py-4 text-center text-xs text-slate-500">
                {idle ? 'Batteries appear here once a card is verified.' : 'Hands are empty.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {session.hands.map((id) => {
                  const b = lookup(id)
                  const fromStation = isStationPack(id)
                  const foreign = !fromStation && !session.customer?.batteryIds.includes(id)
                  const canInsert = session.awaiting === 'insert' && !fromStation
                  return (
                    <button
                      key={id}
                      disabled={!canInsert}
                      onClick={() => insert(id)}
                      className={cx(
                        'rounded-xl border p-3 text-left transition animate-scale-in',
                        canInsert ? 'border-zeno-400/50 bg-zeno-400/10 hover:bg-zeno-400/20 animate-glow' : 'border-white/5 bg-white/[0.03]',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold">{id}</span>
                        <span className={cx('text-xs font-bold', b.soc > 90 ? 'text-zeno-300' : 'text-rose-300')}>{b.soc}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className={cx('h-full rounded-full', b.soc > 90 ? 'bg-zeno-400' : 'bg-rose-400')} style={{ width: `${b.soc}%` }} />
                      </div>
                      <p className={cx('mt-1.5 text-[10px] font-semibold', fromStation ? 'text-zeno-300' : foreign ? 'text-rose-300' : 'text-slate-400')}>
                        {fromStation ? 'Charged · from station' : foreign ? 'Not linked to this RFID' : 'Drained · yours'}
                        {canInsert && ' — tap to insert'}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </Panel>

          <Panel step="3" title="Failure scenario" subtitle={idle ? 'Inject a fault before tapping a card' : 'Locked during session'}>
            <div className="grid grid-cols-2 gap-1.5">
              {SCENARIOS.map((s) => (
                <button
                  key={s.value}
                  disabled={!idle}
                  onClick={() => setScenario(s.value)}
                  title={s.hint}
                  className={cx(
                    'rounded-xl border px-3 py-2 text-left transition disabled:cursor-not-allowed',
                    scenario === s.value
                      ? s.value === 'normal'
                        ? 'border-zeno-400/60 bg-zeno-400/10'
                        : 'border-rose-400/60 bg-rose-500/10'
                      : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06]',
                    !idle && scenario !== s.value && 'opacity-40',
                  )}
                >
                  <span className="block text-xs font-semibold">{s.label}</span>
                  <span className="block text-[10px] leading-tight text-slate-400">{s.hint}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel step="4" title="Session log" subtitle={session.result ? session.result.id : 'Live record sent to admin'}>
            {session.steps.length === 0 ? (
              <p className="rounded-xl bg-white/[0.03] px-3 py-4 text-center text-xs text-slate-500">No active session.</p>
            ) : (
              <SwapTimeline steps={session.steps} dark />
            )}
            {finished && (
              <div className="mt-4 flex gap-2">
                <Link to="/admin/swaps" className="flex-1 rounded-xl bg-white/10 py-2 text-center text-xs font-semibold transition hover:bg-white/15">
                  View in admin
                </Link>
                <button onClick={reset} className="flex-1 rounded-xl bg-zeno-500 py-2 text-xs font-semibold transition hover:bg-zeno-400">
                  Next rider
                </button>
              </div>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  )
}

/** Physical-looking RFID card for the rider who came from the portal */
function RiderCard({
  name,
  rfid,
  vehicle,
  socs,
  blocked,
  active,
}: {
  name: string
  rfid: string
  vehicle: string
  socs: number[]
  blocked: boolean
  active: boolean
}) {
  return (
    <div
      className={cx(
        'relative aspect-[1.6] overflow-hidden rounded-2xl bg-gradient-to-br from-zeno-500 via-zeno-700 to-ink-800 p-4 shadow-xl shadow-black/40 transition duration-500',
        active ? 'scale-[0.97] ring-2 ring-zeno-300' : 'animate-float',
      )}
    >
      <ZDiamond className="absolute -bottom-8 -right-8 size-36 text-white/10" strokeWidth={4} />
      <div className="flex items-start justify-between">
        <span className="font-display text-sm font-bold">
          zeno<span className="text-zeno-200">swap</span>
        </span>
        <Icon name="nfc" className="size-6 text-white/80" />
      </div>
      <div className="mt-3 h-6 w-9 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 opacity-90" />
      <div className="absolute inset-x-4 bottom-4">
        <p className="font-mono text-sm tracking-[0.18em] text-white">{rfid}</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-[10px] text-white/60">{vehicle}</p>
          </div>
          {blocked ? (
            <span className="rounded-md bg-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-100">BLOCKED</span>
          ) : (
            <span className="rounded-md bg-black/25 px-2 py-0.5 text-[11px] font-bold font-tabular">{socs.join('% · ')}%</span>
          )}
        </div>
      </div>
    </div>
  )
}

function handsHint(awaiting: string | null, canInsert: boolean) {
  if (awaiting === 'insert' && canInsert) return 'Tap a drained battery to insert it into the open box'
  if (awaiting === 'take') return 'Use “Take battery” on the open box'
  if (awaiting === 'close') return 'Close the open door on the machine'
  return 'What the rider is carrying'
}

function Panel({
  id,
  step,
  title,
  subtitle,
  children,
}: {
  id?: string
  step: string
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section id={id} className="rounded-3xl border border-white/5 bg-white/[0.03] p-4 animate-fade-up">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-zeno-500/15 text-xs font-bold text-zeno-300">{step}</span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="truncate text-[11px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}
