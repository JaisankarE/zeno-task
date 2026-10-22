import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StationStatusBadge } from '../../components/StatusBadges'
import { slotColors } from '../../lib/status'
import { Card, CardHeader, StatCard } from '../../components/ui'
import { cx } from '../../lib/cx'
import { inr, isToday } from '../../lib/format'
import { Link } from '../../components/Link'
import { FAILURES } from '../../lib/swap'
import { useZenoStore } from '../../stores/useZenoStore'
import type { FailureCode, Swap } from '../../types'
import { SwapDetailDrawer, SwapTable } from './SwapRecords'

export function OverviewPage() {
  const swaps = useZenoStore((s) => s.swaps)
  const stations = useZenoStore((s) => s.stations)
  const batteries = useZenoStore((s) => s.batteries)
  const [selected, setSelected] = useState<Swap | null>(null)

  const stats = useMemo(() => {
    const today = swaps.filter((s) => isToday(s.startedAt))
    const success = swaps.filter((s) => s.status === 'success')
    const failed = swaps.filter((s) => s.status !== 'success')
    const revenue = success.reduce((n, s) => n + s.amount, 0)
    const pending = swaps.filter((s) => s.payment === 'pending').reduce((n, s) => n + s.amount, 0)
    const fleet = Object.values(batteries)
    return {
      today: today.length,
      todayOk: today.filter((s) => s.status === 'success').length,
      rate: swaps.length ? Math.round((success.length / swaps.length) * 1000) / 10 : 0,
      failed: failed.length,
      revenue,
      pending,
      ready: fleet.filter((b) => b.status === 'ready').length,
      charging: fleet.filter((b) => b.status === 'charging').length,
      faulty: fleet.filter((b) => b.status === 'faulty').length,
    }
  }, [swaps, batteries])

  const days = useMemo(() => {
    const out: Array<{ label: string; ok: number; bad: number }> = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toDateString()
      const list = swaps.filter((s) => new Date(s.startedAt).toDateString() === key)
      out.push({
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        ok: list.filter((s) => s.status === 'success').length,
        bad: list.filter((s) => s.status !== 'success').length,
      })
    }
    return out
  }, [swaps])

  const reasons = useMemo(() => {
    const counts = new Map<FailureCode, number>()
    swaps.forEach((s) => s.failure && counts.set(s.failure.code, (counts.get(s.failure.code) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [swaps])

  const max = Math.max(...days.map((d) => d.ok + d.bad), 1)
  const maxReason = Math.max(...reasons.map((r) => r[1]), 1)
  const online = stations.filter((s) => s.status === 'online').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Swaps today"
          value={stats.today}
          hint={<><span className="font-semibold text-emerald-600">{stats.todayOk} successful</span> · {stats.today - stats.todayOk} failed</>}
          icon="swap"
          delay={0}
        />
        <StatCard
          label="Success rate · 14 days"
          value={`${stats.rate}%`}
          hint={`${swaps.length} sessions recorded`}
          icon="trend"
          tone="blue"
          delay={60}
        />
        <StatCard
          label="Failed / aborted"
          value={stats.failed}
          hint={<Link to="/admin/failures" className="font-semibold text-rose-600 hover:underline">View root causes →</Link>}
          icon="alert"
          tone="red"
          delay={120}
        />
        <StatCard
          label="Revenue · 14 days"
          value={inr(stats.revenue)}
          hint={<><span className="font-semibold text-amber-600">{inr(stats.pending)}</span> pending in rider app</>}
          icon="rupee"
          tone="violet"
          delay={180}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Swaps per day"
            subtitle="Last 14 days · successful vs failed"
            action={
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-zeno-500" /> Success</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-rose-400" /> Failed</span>
              </div>
            }
          />
          <div className="px-5 pb-4 pt-6">
            <div className="flex h-56 items-end gap-1.5 sm:gap-2.5">
              {days.map((d, i) => (
                <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
                  <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11px] text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                    <span className="font-semibold">{d.label}</span> · {d.ok} ok · {d.bad} failed
                  </div>
                  <div
                    className="flex flex-col justify-end overflow-hidden rounded-t-md transition-all duration-700 group-hover:brightness-110"
                    style={{ height: `${((d.ok + d.bad) / max) * 100}%`, animation: `fade-up .6s ${i * 35}ms both` }}
                  >
                    <div className="bg-rose-400" style={{ height: `${(d.bad / Math.max(d.ok + d.bad, 1)) * 100}%` }} />
                    <div className="flex-1 bg-gradient-to-t from-zeno-600 to-zeno-400" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5 sm:gap-2.5">
              {days.map((d, i) => (
                <span key={d.label} className="flex-1 text-center text-[10px] text-slate-400">
                  {i % 2 === 1 || i === 13 ? d.label.split(' ')[0] : ''}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Failure root causes" subtitle="All failed & aborted sessions" />
          <div className="space-y-3.5 px-5 py-5">
            {reasons.map(([code, n], i) => (
              <div key={code} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{FAILURES[code].title}</span>
                  <span className="font-semibold text-slate-900 font-tabular">{n}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-[width] duration-1000"
                    style={{ width: `${(n / maxReason) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent swap sessions"
            subtitle="Click a row to see the full Collect → Exchange → Dispense timeline"
            action={
              <Link to="/admin/swaps" className="text-xs font-semibold text-zeno-700 hover:underline">
                View all
              </Link>
            }
          />
          <SwapTable swaps={swaps.slice(0, 7)} onSelect={setSelected} compact />
        </Card>

        <Card>
          <CardHeader
            title="Station health"
            subtitle={`${online}/${stations.length} online`}
            action={
              <Link to="/admin/stations" className="text-xs font-semibold text-zeno-700 hover:underline">
                Details
              </Link>
            }
          />
          <ul className="divide-y divide-slate-100">
            {stations.map((st) => {
              const ready = st.slots.filter((s) => s.state === 'ready').length
              return (
                <li key={st.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{st.name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{st.id}</p>
                    </div>
                    <StationStatusBadge status={st.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="grid flex-1 grid-cols-10 gap-0.5">
                      {st.slots.map((slot) => (
                        <span key={slot.no} title={`Box ${slot.no}: ${slot.state}`} className={cx('h-2 rounded-sm ring-1 ring-inset', slotColors[slot.state])} />
                      ))}
                    </div>
                    <span className={cx('text-[11px] font-semibold font-tabular', ready < 2 ? 'text-rose-600' : 'text-emerald-600')}>
                      {ready} ready
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="grid grid-cols-3 border-t border-slate-100 text-center">
            {[
              ['Ready', stats.ready, 'text-emerald-600'],
              ['Charging', stats.charging, 'text-amber-600'],
              ['Faulty', stats.faulty, 'text-rose-600'],
            ].map(([l, v, c]) => (
              <div key={l} className="px-2 py-3">
                <p className={cx('font-display text-lg font-bold font-tabular', String(c))}>{v}</p>
                <p className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
                  <Icon name="battery" className="size-3" /> {l}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <SwapDetailDrawer swap={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
