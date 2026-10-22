import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { SwapStatusBadge } from '../../components/StatusBadges'
import { Card, CardHeader, EmptyState } from '../../components/ui'
import { cx } from '../../lib/cx'
import { dateTime } from '../../lib/format'
import { FAILURES } from '../../lib/swap'
import { useZenoStore } from '../../stores/useZenoStore'
import type { FailureCode, StepKey, Swap } from '../../types'
import { SwapDetailDrawer } from './SwapRecords'
import { useLookups } from './useLookups'

const STAGES: Array<{ key: StepKey; label: string; desc: string }> = [
  { key: 'auth', label: 'RFID / Auth', desc: 'Card tap & eligibility' },
  { key: 'collect', label: 'Collect', desc: 'C.Bat1 into empty box' },
  { key: 'exchange', label: 'Exchange', desc: 'S.Bat1 ⇄ C.Bat2' },
  { key: 'dispense', label: 'Dispense', desc: 'Take S.Bat2' },
]

export function FailuresPage() {
  const swaps = useZenoStore((s) => s.swaps)
  const { customer, station } = useLookups()
  const [code, setCode] = useState<FailureCode | 'all'>('all')
  const [stage, setStage] = useState<StepKey | 'all'>('all')
  const [selected, setSelected] = useState<Swap | null>(null)

  const failures = useMemo(() => swaps.filter((s) => s.failure), [swaps])
  const byCode = useMemo(() => {
    const m = new Map<FailureCode, number>()
    failures.forEach((s) => m.set(s.failure!.code, (m.get(s.failure!.code) ?? 0) + 1))
    return m
  }, [failures])

  const rows = failures.filter(
    (s) => (code === 'all' || s.failure!.code === code) && (stage === 'all' || s.failure!.step === stage),
  )
  const rate = swaps.length ? ((failures.length / swaps.length) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card className="relative overflow-hidden bg-ink-950 p-6 text-white">
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-rose-500/20 blur-3xl" />
          <p className="text-xs font-medium text-slate-400">Failure rate · 14 days</p>
          <p className="mt-2 font-display text-5xl font-bold font-tabular">{rate}%</p>
          <p className="mt-2 text-sm text-slate-400">
            {failures.length} of {swaps.length} sessions failed or were aborted.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">Hardware</p>
              <p className="mt-1 text-lg font-bold">
                {(byCode.get('SLOT_JAM') ?? 0) + (byCode.get('BATTERY_FAULT') ?? 0) + (byCode.get('COMM_LOST') ?? 0)}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">Customer-side</p>
              <p className="mt-1 text-lg font-bold">
                {(byCode.get('DOOR_TIMEOUT') ?? 0) + (byCode.get('BATTERY_MISMATCH') ?? 0) + (byCode.get('USER_ABORT') ?? 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Where swaps break" subtitle="Failures by stage of the swap flow · click to filter" />
          <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
            {STAGES.map((s, i) => {
              const n = failures.filter((f) => f.failure!.step === s.key).length
              const active = stage === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setStage(active ? 'all' : s.key)}
                  className={cx(
                    'relative rounded-2xl border p-4 text-left transition animate-fade-up',
                    active ? 'border-rose-300 bg-rose-50 ring-4 ring-rose-100' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step {i + 1}</span>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{s.label}</p>
                  <p className="text-[11px] text-slate-500">{s.desc}</p>
                  <p className="mt-3 font-display text-2xl font-bold text-rose-600 font-tabular">{n}</p>
                  {i < 3 && (
                    <Icon name="chevronRight" className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-slate-300 md:block" />
                  )}
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCode('all')}
          className={cx(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition',
            code === 'all' ? 'bg-ink-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
          )}
        >
          All reasons · {failures.length}
        </button>
        {(Object.keys(FAILURES) as FailureCode[]).map((c) => (
          <button
            key={c}
            onClick={() => setCode(code === c ? 'all' : c)}
            className={cx(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition',
              code === c ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {FAILURES[c].title} · {byCode.get(c) ?? 0}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Failure log" subtitle={`${rows.length} records · click for full session timeline`} />
        {rows.length === 0 ? (
          <EmptyState icon="check" title="No failures for this filter" />
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">When · Swap ID</th>
                  <th className="px-3 py-3">Customer · RFID</th>
                  <th className="px-3 py-3">Station</th>
                  <th className="px-3 py-3">Failed at</th>
                  <th className="px-3 py-3">Reason</th>
                  <th className="px-5 py-3">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((s) => {
                  const f = s.failure!
                  const c = customer(s.customerId)
                  const failedStep = s.steps.find((x) => !x.ok)
                  return (
                    <tr key={s.id} onClick={() => setSelected(s)} className="cursor-pointer align-top transition hover:bg-rose-50/30">
                      <td className="px-5 py-3">
                        <p className="text-xs text-slate-500">{dateTime(s.startedAt)}</p>
                        <p className="font-mono text-[12px] font-semibold text-slate-800">{s.id}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className={cx('font-medium', c ? 'text-slate-800' : 'italic text-rose-600')}>{c?.name ?? 'Unknown card'}</p>
                        <p className="font-mono text-[11px] text-slate-400">{s.rfid}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{station(s.stationId)?.name}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold capitalize text-slate-700">
                          {f.step}
                          {failedStep?.slot ? ` · Box ${failedStep.slot}` : ''}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-3 py-3">
                        <div className="flex items-center gap-2">
                          <SwapStatusBadge status={s.status} />
                          <span className="font-semibold text-slate-800">{FAILURES[f.code].title}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{f.message}</p>
                      </td>
                      <td className="max-w-[240px] px-5 py-3 text-xs text-slate-600">{f.resolution}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SwapDetailDrawer swap={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
