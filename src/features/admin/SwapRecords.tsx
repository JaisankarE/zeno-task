import { Icon } from '../../components/Icon'
import { PaymentBadge, SwapStatusBadge } from '../../components/StatusBadges'
import { SwapTimeline } from '../../components/SwapTimeline'
import { Badge, Drawer, EmptyState } from '../../components/ui'
import { cx } from '../../lib/cx'
import { dateTime, durationSec, inr, relative } from '../../lib/format'
import { FAILURES } from '../../lib/swap'
import { useLookups } from './useLookups'
import type { Swap } from '../../types'


export function BoxPath({ swap }: { swap: Swap }) {
  const { collect, exchange, dispense } = swap.slots
  const cells: Array<[string, number | null, string]> = [
    ['C', collect, 'Collect'],
    ['X', exchange, 'Exchange'],
    ['D', dispense, 'Dispense'],
  ]
  return (
    <div className="flex items-center gap-1">
      {cells.map(([k, n, title], i) => (
        <span key={k} className="flex items-center gap-1">
          <span
            title={`${title}${n ? ` · Box ${n}` : ' · not reached'}`}
            className={cx(
              'grid h-6 min-w-6 place-items-center rounded-md px-1 text-[11px] font-bold font-tabular',
              n ? 'bg-slate-900 text-white' : 'border border-dashed border-slate-300 text-slate-300',
            )}
          >
            {n ?? '–'}
          </span>
          {i < 2 && <Icon name="chevronRight" className="size-3 text-slate-300" />}
        </span>
      ))}
    </div>
  )
}

export function SwapTable({
  swaps,
  onSelect,
  compact,
}: {
  swaps: Swap[]
  onSelect: (swap: Swap) => void
  compact?: boolean
}) {
  const { customer, station } = useLookups()
  if (swaps.length === 0) return <EmptyState icon="search" title="No swaps match" body="Try a different filter or search term." />

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <th className="px-5 py-3">Swap ID</th>
            <th className="px-3 py-3">Customer · RFID</th>
            <th className="px-3 py-3">Station</th>
            <th className="px-3 py-3">Boxes C → X → D</th>
            {!compact && <th className="px-3 py-3">In → Out batteries</th>}
            <th className="px-3 py-3">Status</th>
            <th className="px-5 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {swaps.map((s) => {
            const c = customer(s.customerId)
            const st = station(s.stationId)
            return (
              <tr
                key={s.id}
                onClick={() => onSelect(s)}
                className="group cursor-pointer transition hover:bg-zeno-50/40"
              >
                <td className="px-5 py-3">
                  <div className="font-mono text-[12px] font-semibold text-slate-800 group-hover:text-zeno-700">{s.id}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{dateTime(s.startedAt)}</div>
                </td>
                <td className="px-3 py-3">
                  {c ? (
                    <div className="font-medium text-slate-800">{c.name}</div>
                  ) : (
                    <div className="font-medium italic text-rose-600">Unknown card</div>
                  )}
                  <div className="font-mono text-[11px] text-slate-400">{s.rfid}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-slate-700">{st?.name}</div>
                  <div className="font-mono text-[11px] text-slate-400">{s.stationId}</div>
                </td>
                <td className="px-3 py-3">
                  <BoxPath swap={s} />
                </td>
                {!compact && (
                  <td className="px-3 py-3 font-mono text-[11px] leading-5">
                    <div className="text-slate-500">
                      <span className="text-rose-500">↓</span> {s.inBatteries.map((b) => b ?? '—').join(' · ')}
                    </div>
                    <div className="text-slate-500">
                      <span className="text-zeno-600">↑</span> {s.outBatteries.map((b) => b ?? '—').join(' · ')}
                    </div>
                  </td>
                )}
                <td className="px-3 py-3">
                  <SwapStatusBadge status={s.status} />
                  {s.failure && <div className="mt-1 text-[11px] text-slate-500">{FAILURES[s.failure.code].title}</div>}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="font-semibold text-slate-800 font-tabular">{s.amount ? inr(s.amount) : '—'}</div>
                  <div className="mt-1">
                    <PaymentBadge status={s.payment} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function SwapDetailDrawer({ swap, onClose }: { swap: Swap | null; onClose: () => void }) {
  const { customer, station } = useLookups()
  const c = swap ? customer(swap.customerId) : undefined
  const st = swap ? station(swap.stationId) : undefined

  return (
    <Drawer
      open={!!swap}
      onClose={onClose}
      title={<span className="font-mono">{swap?.id}</span>}
      subtitle={swap && `${dateTime(swap.startedAt)} · ${relative(swap.startedAt)} · took ${durationSec(swap.startedAt, swap.endedAt)}`}
    >
      {swap && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <SwapStatusBadge status={swap.status} />
            <PaymentBadge status={swap.payment} />
            {swap.failure && <Badge tone="red">{swap.failure.code}</Badge>}
          </div>

          {swap.failure && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-rose-800">
                <Icon name="alert" /> {FAILURES[swap.failure.code].title}
                <span className="ml-auto rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold capitalize text-rose-600">
                  at {swap.failure.step}
                </span>
              </p>
              <p className="mt-2 text-sm text-rose-700">{swap.failure.message}</p>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-rose-600/90">
                <Icon name="wrench" className="mt-0.5 size-3.5 shrink-0" /> {swap.failure.resolution}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Info label="Customer" value={c?.name ?? 'Unknown card'} sub={c?.phone} />
            <Info label="RFID card" value={swap.rfid} mono />
            <Info label="Station" value={st?.name ?? swap.stationId} sub={swap.stationId} />
            <Info label="Vehicle" value={c?.vehicle.regNo ?? '—'} sub={c?.vehicle.model} />
            <Info label="Energy delivered" value={`${swap.energyKwh} kWh`} />
            <Info label="Amount" value={swap.amount ? inr(swap.amount) : '—'} sub={c?.plan} />
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Battery movement</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-rose-50/60 p-3">
                <p className="text-[11px] font-semibold text-rose-600">Returned by customer</p>
                <p className="mt-1.5 font-mono text-xs text-slate-700">C.Bat1 · {swap.inBatteries[0] ?? '—'}</p>
                <p className="font-mono text-xs text-slate-700">C.Bat2 · {swap.inBatteries[1] ?? '—'}</p>
              </div>
              <div className="rounded-xl bg-zeno-50/70 p-3">
                <p className="text-[11px] font-semibold text-zeno-700">Issued by station</p>
                <p className="mt-1.5 font-mono text-xs text-slate-700">S.Bat1 · {swap.outBatteries[0] ?? '—'}</p>
                <p className="font-mono text-xs text-slate-700">S.Bat2 · {swap.outBatteries[1] ?? '—'}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Box sequence</span>
              <BoxPath swap={swap} />
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Session timeline</p>
            <SwapTimeline steps={swap.steps} />
          </div>
        </div>
      )}
    </Drawer>
  )
}

function Info({ label, value, sub, mono }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className={cx('mt-1 truncate text-sm font-semibold text-slate-800', mono && 'font-mono text-[13px]')}>{value}</p>
      {sub && <p className="truncate text-[11px] text-slate-500">{sub}</p>}
    </div>
  )
}
