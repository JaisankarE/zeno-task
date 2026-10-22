import { useMemo, useState } from 'react'
import { BatteryBar } from '../../components/Battery'
import { BatteryStatusBadge } from '../../components/StatusBadges'
import { Card, Input, Segmented } from '../../components/ui'
import { cx } from '../../lib/cx'
import { useZenoStore } from '../../stores/useZenoStore'
import type { BatteryStatus } from '../../types'

export function BatteriesPage() {
  const batteries = useZenoStore((s) => s.batteries)
  const customers = useZenoStore((s) => s.customers)
  const stations = useZenoStore((s) => s.stations)
  const [status, setStatus] = useState<'all' | BatteryStatus>('all')
  const [query, setQuery] = useState('')

  const list = useMemo(() => Object.values(batteries).sort((a, b) => a.id.localeCompare(b.id)), [batteries])
  const where = (loc: string) => {
    const c = customers.find((x) => x.id === loc)
    if (c) return { name: c.name, sub: c.vehicle.regNo }
    return { name: stations.find((x) => x.id === loc)?.name ?? loc, sub: loc }
  }
  const slotOf = (id: string) => {
    for (const st of stations) {
      const slot = st.slots.find((s) => s.batteryId === id)
      if (slot) return slot.no
    }
    return null
  }

  const q = query.trim().toLowerCase()
  const rows = list.filter((b) => (status === 'all' || b.status === status) && (!q || b.id.toLowerCase().includes(q) || where(b.location).name.toLowerCase().includes(q)))
  const count = (s: BatteryStatus) => list.filter((b) => b.status === s).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All', count: list.length },
            { value: 'in-vehicle', label: 'In vehicle', count: count('in-vehicle') },
            { value: 'ready', label: 'Ready', count: count('ready') },
            { value: 'charging', label: 'Charging', count: count('charging') },
            { value: 'faulty', label: 'Faulty', count: count('faulty') },
          ]}
        />
        <div className="w-full sm:w-72">
          <Input icon="search" placeholder="Battery ID or location…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Battery ID</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">State of charge</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3 text-right">Health</th>
                <th className="px-3 py-3 text-right">Cycles</th>
                <th className="px-5 py-3 text-right">Temp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((b) => {
                const loc = where(b.location)
                const slot = slotOf(b.id)
                return (
                  <tr key={b.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-2.5 font-mono text-[12px] font-semibold text-slate-800">{b.id}</td>
                    <td className="px-3 py-2.5"><BatteryStatusBadge status={b.status} /></td>
                    <td className="px-3 py-2.5"><BatteryBar soc={b.soc} charging={b.status === 'charging'} /></td>
                    <td className="px-3 py-2.5">
                      <p className="text-slate-700">{loc.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {b.status === 'in-vehicle' ? loc.sub : slot ? `${b.location} · Box ${slot}` : `${b.location} · back room`}
                      </p>
                    </td>
                    <td className={cx('px-3 py-2.5 text-right font-semibold font-tabular', b.health < 88 ? 'text-amber-600' : 'text-slate-700')}>{b.health}%</td>
                    <td className="px-3 py-2.5 text-right text-slate-600 font-tabular">{b.cycles}</td>
                    <td className={cx('px-5 py-2.5 text-right font-semibold font-tabular', b.tempC > 50 ? 'text-rose-600' : 'text-slate-600')}>{b.tempC}°C</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
