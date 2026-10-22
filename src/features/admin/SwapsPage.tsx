import { useMemo, useState } from 'react'
import { Button, Card, Input, Segmented } from '../../components/ui'
import { toast } from '../../stores/useToastStore'
import { useZenoStore } from '../../stores/useZenoStore'
import type { Swap, SwapStatus } from '../../types'
import { SwapDetailDrawer, SwapTable } from './SwapRecords'

const PAGE_SIZE = 12

export const selectClass =
  'h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none focus:border-zeno-500 focus:ring-4 focus:ring-zeno-500/15'

export function SwapsPage() {
  const swaps = useZenoStore((s) => s.swaps)
  const stations = useZenoStore((s) => s.stations)
  const customers = useZenoStore((s) => s.customers)
  const [status, setStatus] = useState<'all' | SwapStatus>('all')
  const [stationId, setStationId] = useState('all')
  const [payment, setPayment] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Swap | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return swaps.filter((s) => {
      if (status !== 'all' && s.status !== status) return false
      if (stationId !== 'all' && s.stationId !== stationId) return false
      if (payment !== 'all' && s.payment !== payment) return false
      if (!q) return true
      const name = customers.find((c) => c.id === s.customerId)?.name ?? ''
      return [s.id, s.rfid, name, ...s.inBatteries, ...s.outBatteries]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [swaps, customers, status, stationId, payment, query])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)
  const count = (st: SwapStatus) => swaps.filter((s) => s.status === st).length

  const exportCsv = () => {
    const header = ['swap_id', 'started_at', 'status', 'failure', 'customer', 'rfid', 'station', 'box_collect', 'box_exchange', 'box_dispense', 'c_bat1', 'c_bat2', 's_bat1', 's_bat2', 'kwh', 'amount', 'payment']
    const lines = filtered.map((s) =>
      [
        s.id, s.startedAt, s.status, s.failure?.code ?? '',
        customers.find((c) => c.id === s.customerId)?.name ?? 'Unknown', s.rfid, s.stationId,
        s.slots.collect ?? '', s.slots.exchange ?? '', s.slots.dispense ?? '',
        ...s.inBatteries.map((b) => b ?? ''), ...s.outBatteries.map((b) => b ?? ''),
        s.energyKwh, s.amount, s.payment,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','),
    )
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zeno-swaps-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ tone: 'success', title: 'Export ready', body: `${filtered.length} swap records downloaded as CSV.` })
  }

  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPage(0)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Segmented
          value={status}
          onChange={resetPage(setStatus)}
          options={[
            { value: 'all', label: 'All', count: swaps.length },
            { value: 'success', label: 'Success', count: count('success') },
            { value: 'failed', label: 'Failed', count: count('failed') },
            { value: 'aborted', label: 'Aborted', count: count('aborted') },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-72">
            <Input
              icon="search"
              placeholder="Swap ID, RFID, battery, name…"
              value={query}
              onChange={(e) => resetPage(setQuery)(e.target.value)}
            />
          </div>
          <select className={selectClass} value={stationId} onChange={(e) => resetPage(setStationId)(e.target.value)}>
            <option value="all">All stations</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select className={selectClass} value={payment} onChange={(e) => resetPage(setPayment)(e.target.value)}>
            <option value="all">Any payment</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Payment failed</option>
            <option value="none">No charge</option>
          </select>
          <Button variant="secondary" icon="download" onClick={exportCsv}>
            Export
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <SwapTable swaps={rows} onSelect={setSelected} />
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>
            Showing <b className="text-slate-800">{rows.length ? current * PAGE_SIZE + 1 : 0}–{current * PAGE_SIZE + rows.length}</b> of{' '}
            <b className="text-slate-800">{filtered.length}</b>
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="secondary" icon="chevronLeft" disabled={current === 0} onClick={() => setPage(current - 1)}>
              Prev
            </Button>
            <span className="px-2 font-tabular">
              {current + 1} / {pages}
            </span>
            <Button size="sm" variant="secondary" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <SwapDetailDrawer swap={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
