import { useMemo, useState } from 'react'
import { BatteryBar } from '../../components/Battery'
import { Icon } from '../../components/Icon'
import { PaymentBadge, SwapStatusBadge } from '../../components/StatusBadges'
import { Badge, Card, Drawer, Input } from '../../components/ui'
import { dateTime, inr } from '../../lib/format'
import { useZenoStore } from '../../stores/useZenoStore'
import type { Customer, Swap } from '../../types'
import { SwapDetailDrawer } from './SwapRecords'

export function CustomersPage() {
  const customers = useZenoStore((s) => s.customers)
  const batteries = useZenoStore((s) => s.batteries)
  const swaps = useZenoStore((s) => s.swaps)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [swap, setSwap] = useState<Swap | null>(null)

  const stats = useMemo(() => {
    const m = new Map<string, { total: number; failed: number; due: number }>()
    for (const s of swaps) {
      if (!s.customerId) continue
      const e = m.get(s.customerId) ?? { total: 0, failed: 0, due: 0 }
      e.total++
      if (s.status !== 'success') e.failed++
      if (s.payment === 'pending' || s.payment === 'failed') e.due += s.amount
      m.set(s.customerId, e)
    }
    return m
  }, [swaps])

  const q = query.trim().toLowerCase()
  const rows = customers.filter((c) =>
    [c.name, c.rfid, c.phone, c.vehicle.regNo, ...c.batteryIds].some((v) => v.toLowerCase().includes(q)),
  )
  const current = selected ? customers.find((c) => c.id === selected.id) ?? null : null
  const history = current ? swaps.filter((s) => s.customerId === current.id) : []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input icon="search" placeholder="Name, RFID, phone, reg no, battery…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <p className="text-xs text-slate-500">
          {customers.length} riders · {customers.filter((c) => c.status === 'blocked').length} blocked
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Customer</th>
                <th className="px-3 py-3">RFID card</th>
                <th className="px-3 py-3">Vehicle</th>
                <th className="px-3 py-3">Battery 1</th>
                <th className="px-3 py-3">Battery 2</th>
                <th className="px-3 py-3">Plan</th>
                <th className="px-3 py-3 text-right">Swaps</th>
                <th className="px-5 py-3 text-right">Dues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => {
                const st = stats.get(c.id)
                const [b1, b2] = c.batteryIds.map((id) => batteries[id])
                return (
                  <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer transition hover:bg-zeno-50/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <div>
                          <p className="font-semibold text-slate-800">{c.name}</p>
                          <p className="text-[11px] text-slate-400">{c.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-mono text-[12px] text-slate-700">{c.rfid}</p>
                      {c.status === 'blocked' && <Badge tone="red">Blocked</Badge>}
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-slate-700">{c.vehicle.regNo}</p>
                      <p className="text-[11px] text-slate-400">{c.vehicle.model}</p>
                    </td>
                    <td className="px-3 py-3"><BatteryBar soc={b1.soc} id={b1.id} /></td>
                    <td className="px-3 py-3"><BatteryBar soc={b2.soc} id={b2.id} /></td>
                    <td className="px-3 py-3">
                      <Badge>{c.plan}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-tabular">
                      <span className="font-semibold text-slate-800">{st?.total ?? 0}</span>
                      {st?.failed ? <span className="text-[11px] text-rose-500"> · {st.failed} failed</span> : null}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold font-tabular">
                      {st?.due ? <span className="text-amber-600">{inr(st.due)}</span> : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Drawer
        open={!!current && !swap}
        onClose={() => setSelected(null)}
        title={current?.name}
        subtitle={current && `${current.id} · joined ${new Date(current.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
      >
        {current && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['RFID', current.rfid],
                ['Phone', current.phone],
                ['Vehicle', `${current.vehicle.model} · ${current.vehicle.regNo}`],
                ['Plan', current.plan],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-400">{l}</p>
                  <p className="mt-1 font-semibold text-slate-800">{v}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Linked batteries (RFID → 2 packs)</p>
              <div className="grid grid-cols-2 gap-3">
                {current.batteryIds.map((id, i) => {
                  const b = batteries[id]
                  return (
                    <div key={id} className="rounded-xl border border-slate-200 p-3">
                      <p className="text-[11px] font-semibold text-slate-400">Battery {i + 1}</p>
                      <p className="font-mono text-sm font-semibold text-slate-800">{id}</p>
                      <div className="mt-2"><BatteryBar soc={b.soc} /></div>
                      <p className="mt-2 flex gap-3 text-[11px] text-slate-500">
                        <span>Health {b.health}%</span>
                        <span>{b.cycles} cycles</span>
                        <span>{b.tempC}°C</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Swap history · {history.length}</p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {history.map((s) => (
                  <li key={s.id}>
                    <button onClick={() => setSwap(s)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[12px] font-semibold text-slate-800">{s.id}</p>
                        <p className="text-[11px] text-slate-400">{dateTime(s.startedAt)}</p>
                      </div>
                      <SwapStatusBadge status={s.status} />
                      <PaymentBadge status={s.payment} />
                      <Icon name="chevronRight" className="size-4 text-slate-300" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Drawer>

      <SwapDetailDrawer swap={swap} onClose={() => setSwap(null)} />
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('')
  const hue = [...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${(hue + 40) % 360} 65% 42%))` }}
    >
      {initials}
    </span>
  )
}
