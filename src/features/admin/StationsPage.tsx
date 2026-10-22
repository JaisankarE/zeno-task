import { Icon } from '../../components/Icon'
import { StationStatusBadge } from '../../components/StatusBadges'
import { slotColors } from '../../lib/status'
import { Card } from '../../components/ui'
import { cx } from '../../lib/cx'
import { isToday } from '../../lib/format'
import { Link } from '../../components/Link'
import { useZenoStore } from '../../stores/useZenoStore'

export function StationsPage() {
  const stations = useZenoStore((s) => s.stations)
  const swaps = useZenoStore((s) => s.swaps)
  const batteries = useZenoStore((s) => s.batteries)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        {(['ready', 'charging', 'empty', 'faulty'] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5 capitalize">
            <span className={cx('size-3 rounded ring-1 ring-inset', slotColors[s])} /> {s}
          </span>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {stations.map((st, i) => {
          const today = swaps.filter((s) => s.stationId === st.id && isToday(s.startedAt))
          const failed = today.filter((s) => s.status !== 'success').length
          const count = (state: string) => st.slots.filter((s) => s.state === state).length
          const canSwap = st.status === 'online' && count('ready') >= 2 && count('empty') >= 1
          return (
            <Card key={st.id} className="overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold text-slate-900">{st.name}</h3>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Icon name="pin" className="size-3" /> {st.area}, {st.city}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-slate-400">{st.id}</p>
                </div>
                <StationStatusBadge status={st.status} />
              </div>

              {/* Mini replica of the 2×5 box front */}
              <div className="mx-5 rounded-2xl bg-gradient-to-b from-cream-200 to-cream-300 p-3 shadow-inner">
                <div className="mb-2 h-6 rounded-t-xl bg-ink-900" />
                <div className="grid grid-cols-5 gap-1.5">
                  {st.slots.map((slot) => {
                    const b = slot.batteryId ? batteries[slot.batteryId] : null
                    return (
                      <div
                        key={slot.no}
                        title={b ? `${b.id} · ${b.soc}% · ${b.tempC}°C` : 'Empty'}
                        className={cx('rounded-lg px-1.5 py-2 text-center ring-1 ring-inset', slotColors[slot.state])}
                      >
                        <p className="text-[10px] font-bold opacity-60">#{slot.no}</p>
                        <p className="mt-0.5 text-xs font-bold font-tabular">{b ? `${b.soc}%` : '—'}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 px-5 py-4 text-center">
                {[
                  ['Ready', count('ready'), 'text-emerald-600'],
                  ['Charging', count('charging'), 'text-amber-600'],
                  ['Empty', count('empty'), 'text-slate-500'],
                  ['Faulty', count('faulty'), 'text-rose-600'],
                ].map(([l, v, c]) => (
                  <div key={String(l)}>
                    <p className={cx('font-display text-lg font-bold font-tabular', String(c))}>{v}</p>
                    <p className="text-[11px] text-slate-500">{l}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs">
                <span className="text-slate-500">
                  Today: <b className="text-slate-800">{today.length}</b> swaps
                  {failed > 0 && <span className="text-rose-600"> · {failed} failed</span>}
                </span>
                {st.status === 'online' ? (
                  <Link
                    to={`/kiosk/${st.id}`}
                    className={cx(
                      'inline-flex items-center gap-1 font-semibold',
                      canSwap ? 'text-zeno-700 hover:underline' : 'text-amber-600',
                    )}
                  >
                    <Icon name="monitor" className="size-3.5" />
                    {canSwap ? 'Open kiosk' : 'Low stock · open kiosk'}
                  </Link>
                ) : (
                  <span className="text-slate-400">Kiosk unavailable</span>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
