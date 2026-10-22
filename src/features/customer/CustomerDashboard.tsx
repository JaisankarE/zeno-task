import { config } from '../../config'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BatteryRing } from '../../components/Battery'
import { Icon } from '../../components/Icon'
import { Logo } from '../../components/Logo'
import { PaymentBadge, StationStatusBadge, SwapStatusBadge } from '../../components/StatusBadges'
import { SwapTimeline } from '../../components/SwapTimeline'
import { Button, Card, EmptyState, Modal, Segmented } from '../../components/ui'
import { cx } from '../../lib/cx'
import { dateTime, durationSec, inr, relative } from '../../lib/format'
import { Link } from '../../components/Link'
import { navigate } from '../../lib/router'
import { FAILURES, rangeKm } from '../../lib/swap'
import { useAuthStore } from '../../stores/useAuthStore'
import { toast } from '../../stores/useToastStore'
import { useZenoStore } from '../../stores/useZenoStore'
import type { Swap } from '../../types'

type Tab = 'overview' | 'swaps' | 'payments'

export function CustomerDashboard() {
  const customerId = useAuthStore((s) => s.customerId)
  const logout = useAuthStore((s) => s.logoutCustomer)
  const customers = useZenoStore((s) => s.customers)
  const batteries = useZenoStore((s) => s.batteries)
  const stations = useZenoStore((s) => s.stations)
  const allSwaps = useZenoStore((s) => s.swaps)
  const [tab, setTab] = useState<Tab>('overview')
  const [paying, setPaying] = useState<Swap[] | null>(null)
  const [draining, setDraining] = useState(false)

  const customer = customers.find((c) => c.id === customerId)
  const swaps = useMemo(() => allSwaps.filter((s) => s.customerId === customerId), [allSwaps, customerId])

  // Session points at a customer that no longer exists (e.g. after a demo reset)
  useEffect(() => {
    if (!customer) logout()
  }, [customer, logout])

  if (!customer) return null

  const packs = customer.batteryIds.map((id) => batteries[id])
  const lowest = Math.min(...packs.map((b) => b.soc))
  const range = packs.reduce((km, b) => km + rangeKm(b.soc), 0)
  const dues = swaps.filter((s) => s.payment === 'pending' || s.payment === 'failed')
  const dueTotal = dues.reduce((n, s) => n + s.amount, 0)
  const nearby = stations
    .filter((s) => s.city === customer.city)
    .sort((a, b) => a.distanceKm - b.distanceKm)
  const best = nearby.find(
    (s) => s.status === 'online' && s.slots.filter((x) => x.state === 'ready').length >= config.batteriesPerBike,
  )
  const failedCount = swaps.filter((s) => s.status !== 'success').length

  /** Testing helper: simulate a long ride so the low-battery → swap flow can be tried */
  const drainBatteries = () => {
    const targets: Record<string, number> = Object.fromEntries(packs.map((b, i) => [b.id, i % 2 ? 11 : 8]))
    setDraining(true)
    const timer = window.setInterval(() => {
      const { batteries: live, setBatterySoc } = useZenoStore.getState()
      const next: Record<string, number> = {}
      let done = true
      for (const [id, target] of Object.entries(targets)) {
        const soc = Math.max(target, live[id].soc - 3)
        next[id] = soc
        if (soc > target) done = false
      }
      setBatterySoc(next)
      if (done) {
        window.clearInterval(timer)
        setDraining(false)
        toast({ tone: 'info', title: 'Batteries drained', body: 'Battery low — head to a station to swap.' })
      }
    }, 45)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-ink-950 pb-28 text-white grid-glow">
        <div className="mx-auto max-w-6xl px-5 pt-6">
          <header className="flex items-center justify-between">
            <Logo subtitle="Rider Portal" />
            <div className="flex items-center gap-2">
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-semibold">{customer.name}</span>
                <span className="block font-mono text-[11px] text-slate-400">{customer.rfid}</span>
              </span>
              <button
                onClick={() => {
                  logout()
                  navigate('/rider/login')
                }}
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Log out"
                title="Log out"
              >
                <Icon name="logout" />
              </button>
            </div>
          </header>

          <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="animate-fade-up">
              <p className="text-sm text-slate-400">Good to see you,</p>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{customer.name.split(' ')[0]}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                  <Icon name="bike" className="size-3.5" /> {customer.vehicle.model} · {customer.vehicle.regNo}
                </span>
                <span className="rounded-full bg-violet-500/20 px-3 py-1.5 font-semibold text-violet-200">{customer.plan}</span>
                {customer.status === 'blocked' && (
                  <span className="rounded-full bg-rose-500/20 px-3 py-1.5 font-semibold text-rose-200">Account blocked</span>
                )}
              </div>
              <div className="mt-6 flex gap-8">
                <div>
                  <p className="font-display text-3xl font-bold font-tabular">
                    {range}
                    <span className="text-base text-slate-400"> km</span>
                  </p>
                  <p className="text-xs text-slate-400">Estimated range</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-bold font-tabular">{swaps.filter((s) => s.status === 'success').length}</p>
                  <p className="text-xs text-slate-400">Swaps done</p>
                </div>
              </div>
              <button
                onClick={drainBatteries}
                disabled={draining || lowest <= 11}
                title="Testing helper — simulates a long ride"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-dashed border-amber-400/40 bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {draining ? (
                  <span className="size-3.5 animate-spin rounded-full border-2 border-amber-200 border-r-transparent" />
                ) : (
                  <Icon name="battery" className="size-4" />
                )}
                {draining ? 'Draining…' : lowest <= 11 ? 'Batteries already empty' : 'Empty my batteries (test)'}
              </button>
            </div>

            <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
              {packs.map((b, i) => (
                <div key={b.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-center backdrop-blur">
                  <BatteryRing soc={b.soc} label={`Battery ${i + 1}`} />
                  <p className="mt-2 font-mono text-[11px] text-slate-300">{b.id}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Health {b.health}% · {b.tempC}°C
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="relative mx-auto -mt-16 max-w-6xl space-y-5 px-5 pb-12">
        {/* Alerts */}
        {customer.status === 'blocked' ? (
          <Alert
            tone="red"
            icon="lock"
            title="Swaps paused — clear your dues"
            body={`You have ${dues.length} unpaid swap bills totalling ${inr(dueTotal)}. Stations will reject your RFID until paid.`}
            action={<Button variant="danger" onClick={() => setPaying(dues)}>Pay {inr(dueTotal)}</Button>}
          />
        ) : lowest <= config.riderLowAlertSoc ? (
          <Alert
            tone="amber"
            icon="battery"
            title={`Battery low · ${lowest}%`}
            body={
              best
                ? `Nearest swap: ${best.name}, ${best.distanceKm} km away — ${best.slots.filter((x) => x.state === 'ready').length} charged batteries ready.`
                : 'No nearby station has charged batteries right now.'
            }
            action={
              best && (
                <Link
                  to={`/kiosk/${best.id}?rider=${customer.id}`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600"
                >
                  <Icon name="pin" /> Go swap now
                </Link>
              )
            }
          />
        ) : dues.length > 0 ? (
          <Alert
            tone="amber"
            icon="wallet"
            title={`Swap bill pending · ${inr(dueTotal)}`}
            body={`${dues.length} swap bill${dues.length > 1 ? 's' : ''} waiting for payment. Batteries at ${lowest}%+, about ${range} km of range.`}
            action={<Button onClick={() => setPaying(dues)}>Pay {inr(dueTotal)}</Button>}
          />
        ) : (
          <Alert tone="green" icon="zap" title="You're good to ride" body={`${packs.length === 1 ? 'Battery' : packs.length === 2 ? 'Both batteries' : 'All batteries'} above ${lowest}%. About ${range} km of range left.`} />
        )}

        <div className="flex items-center justify-between">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'swaps', label: 'Swap history', count: swaps.length },
              { value: 'payments', label: 'Payments', count: dues.length || undefined },
            ]}
          />
        </div>

        <div key={tab} className="animate-fade-up">
          {tab === 'overview' && (
            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="text-[15px] font-semibold text-slate-900">Recent swaps</h2>
                    <p className="text-xs text-slate-500">{failedCount} unsuccessful attempts on record</p>
                  </div>
                  <button onClick={() => setTab('swaps')} className="text-xs font-semibold text-zeno-700 hover:underline">
                    See all
                  </button>
                </div>
                {swaps.length === 0 ? (
                  <EmptyState icon="swap" title="No swaps yet" body="Visit any Zeno station and tap your RFID card." />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {swaps.slice(0, 5).map((s) => (
                      <SwapRow key={s.id} swap={s} stationName={stations.find((x) => x.id === s.stationId)?.name ?? ''} />
                    ))}
                  </ul>
                )}
              </Card>

              <div className="space-y-5">
                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-slate-900">Outstanding</h2>
                    <Icon name="wallet" className="size-5 text-slate-400" />
                  </div>
                  <p className={cx('mt-3 font-display text-3xl font-bold font-tabular', dueTotal ? 'text-amber-600' : 'text-slate-900')}>
                    {inr(dueTotal)}
                  </p>
                  <p className="text-xs text-slate-500">{dues.length ? `${dues.length} swap bill(s) pending` : 'All bills paid. Nice!'}</p>
                  {dues.length > 0 && (
                    <Button className="mt-4 w-full" onClick={() => setPaying(dues)}>
                      Pay all now
                    </Button>
                  )}
                </Card>

                <Card>
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-[15px] font-semibold text-slate-900">Stations near you</h2>
                    <p className="text-xs text-slate-500">{customer.city}</p>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {nearby.map((st) => {
                      const ready = st.slots.filter((x) => x.state === 'ready').length
                      return (
                        <li key={st.id} className="flex items-center gap-3 px-5 py-3">
                          <span className="grid size-9 place-items-center rounded-xl bg-zeno-50 text-zeno-600">
                            <Icon name="zap" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">{st.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {st.distanceKm} km · {st.status === 'online' ? `${ready} ready` : ''}
                            </p>
                          </div>
                          <StationStatusBadge status={st.status} />
                        </li>
                      )
                    })}
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {tab === 'swaps' && (
            <Card>
              {swaps.length === 0 ? (
                <EmptyState icon="swap" title="No swaps yet" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {swaps.map((s) => (
                    <SwapRow key={s.id} swap={s} stationName={stations.find((x) => x.id === s.stationId)?.name ?? ''} />
                  ))}
                </ul>
              )}
            </Card>
          )}

          {tab === 'payments' && (
            <Card className="overflow-hidden">
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3">Swap</th>
                      <th className="px-3 py-3">Station</th>
                      <th className="px-3 py-3 text-right">Energy</th>
                      <th className="px-3 py-3 text-right">Amount</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-5 py-3 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {swaps
                      .filter((s) => s.status === 'success')
                      .map((s) => (
                        <tr key={s.id}>
                          <td className="px-5 py-3">
                            <p className="font-mono text-[12px] font-semibold text-slate-800">{s.id}</p>
                            <p className="text-[11px] text-slate-400">{dateTime(s.startedAt)}</p>
                          </td>
                          <td className="px-3 py-3 text-slate-700">{stations.find((x) => x.id === s.stationId)?.name}</td>
                          <td className="px-3 py-3 text-right text-slate-600 font-tabular">{s.energyKwh} kWh</td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-800 font-tabular">{s.amount ? inr(s.amount) : '—'}</td>
                          <td className="px-3 py-3"><PaymentBadge status={s.payment} /></td>
                          <td className="px-5 py-3 text-right">
                            {(s.payment === 'pending' || s.payment === 'failed') && (
                              <Button size="sm" onClick={() => setPaying([s])}>
                                Pay
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>

      <PaymentModal bills={paying} customerId={customer.id} onClose={() => setPaying(null)} />
    </div>
  )
}

function Alert({
  tone,
  icon,
  title,
  body,
  action,
}: {
  tone: 'red' | 'amber' | 'green'
  icon: 'lock' | 'battery' | 'zap' | 'wallet'
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div
      className={cx(
        'flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-xl shadow-slate-900/5 sm:flex-row sm:items-center animate-fade-up',
        tone === 'red' && 'border-rose-200',
        tone === 'amber' && 'border-amber-200',
        tone === 'green' && 'border-emerald-200',
      )}
    >
      <span
        className={cx(
          'grid size-12 shrink-0 place-items-center rounded-2xl',
          tone === 'red' && 'bg-rose-50 text-rose-600',
          tone === 'amber' && 'bg-amber-50 text-amber-600 animate-glow',
          tone === 'green' && 'bg-emerald-50 text-emerald-600',
        )}
      >
        <Icon name={icon} className="size-6" />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{body}</p>
      </div>
      {action}
    </div>
  )
}

function SwapRow({ swap, stationName }: { swap: Swap; stationName: string }) {
  const [open, setOpen] = useState(false)
  const ok = swap.status === 'success'
  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-slate-50"
      >
        <span
          className={cx(
            'grid size-10 shrink-0 place-items-center rounded-xl',
            ok ? 'bg-zeno-50 text-zeno-600' : 'bg-rose-50 text-rose-600',
          )}
        >
          <Icon name={ok ? 'swap' : 'alert'} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">{stationName}</p>
          <p className="text-[11px] text-slate-500">
            {dateTime(swap.startedAt)} · {relative(swap.startedAt)}
            {!ok && swap.failure && <span className="text-rose-600"> · {FAILURES[swap.failure.code].title}</span>}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800 font-tabular">{swap.amount ? inr(swap.amount) : '—'}</p>
          <PaymentBadge status={swap.payment} />
        </div>
        <SwapStatusBadge status={swap.status} />
        <Icon name="chevronRight" className={cx('size-4 text-slate-300 transition', open && 'rotate-90')} />
      </button>
      {open && (
        <div className="grid gap-5 border-t border-slate-100 bg-slate-50/60 px-5 py-5 md:grid-cols-[1fr_1.4fr] animate-fade-in">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-[11px] text-slate-400">Swap ID</p>
              <p className="font-mono text-[13px] font-semibold text-slate-800">{swap.id}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <p className="text-[11px] font-semibold text-rose-600">You returned</p>
                <div className="mt-1">
                  {swap.inBatteries.map((id, i) => (
                    <p key={i} className="font-mono text-[11px] text-slate-700">{id ?? '—'}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <p className="text-[11px] font-semibold text-zeno-700">You received</p>
                <div className="mt-1">
                  {swap.outBatteries.map((id, i) => (
                    <p key={i} className="font-mono text-[11px] text-slate-700">{id ?? '—'}</p>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Took {durationSec(swap.startedAt, swap.endedAt)} · {swap.energyKwh} kWh
            </p>
            {swap.failure && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <p className="font-semibold">{FAILURES[swap.failure.code].title}</p>
                <p className="mt-1">{swap.failure.resolution}</p>
              </div>
            )}
          </div>
          <SwapTimeline steps={swap.steps} />
        </div>
      )}
    </li>
  )
}

function PaymentModal({ bills, customerId, onClose }: { bills: Swap[] | null; customerId: string; onClose: () => void }) {
  const payBill = useZenoStore((s) => s.payBill)
  const payAll = useZenoStore((s) => s.payAll)
  const [method, setMethod] = useState<'upi' | 'card' | 'wallet'>('upi')
  const [state, setState] = useState<'idle' | 'processing' | 'done'>('idle')
  const total = bills?.reduce((n, s) => n + s.amount, 0) ?? 0

  const close = () => {
    setState('idle')
    onClose()
  }

  const pay = () => {
    if (!bills) return
    setState('processing')
    window.setTimeout(() => {
      if (bills.length > 1) payAll(customerId)
      else payBill(bills[0].id)
      setState('done')
      toast({ tone: 'success', title: 'Payment successful', body: `${inr(total)} paid via ${method.toUpperCase()}.` })
      window.setTimeout(close, 1400)
    }, 1300)
  }

  return (
    <Modal open={!!bills} onClose={close}>
      {state === 'done' ? (
        <div className="py-6 text-center animate-scale-in">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-zeno-500 text-white shadow-lg shadow-zeno-500/30">
            <Icon name="check" className="size-8" />
          </span>
          <p className="mt-4 text-lg font-semibold text-slate-900">Paid {inr(total)}</p>
          <p className="text-sm text-slate-500">Receipt sent to your email.</p>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-slate-900">Pay swap bill{bills && bills.length > 1 ? 's' : ''}</h3>
          <p className="mt-1 text-sm text-slate-500">{bills?.length} swap(s) · billed per kWh delivered + service fee</p>
          <div className="mt-4 max-h-40 space-y-1.5 overflow-y-auto scrollbar-thin">
            {bills?.map((b) => (
              <div key={b.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="font-mono text-slate-600">{b.id}</span>
                <span className="font-semibold text-slate-800">{inr(b.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {(['upi', 'card', 'wallet'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cx(
                  'rounded-xl border px-3 py-3 text-xs font-semibold uppercase transition',
                  method === m ? 'border-zeno-500 bg-zeno-50 text-zeno-700 ring-4 ring-zeno-500/10' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                <Icon name={m === 'upi' ? 'phone' : m === 'card' ? 'card' : 'wallet'} className="mx-auto mb-1 size-5" />
                {m}
              </button>
            ))}
          </div>
          <Button size="lg" className="mt-6 w-full" loading={state === 'processing'} onClick={pay}>
            Pay {inr(total)}
          </Button>
        </>
      )}
    </Modal>
  )
}
