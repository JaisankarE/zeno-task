import { cx } from '../lib/cx'
import { socTone } from '../lib/format'

const fillByTone = {
  low: 'bg-rose-500',
  mid: 'bg-amber-400',
  high: 'bg-zeno-500',
}

const strokeByTone = {
  low: '#f43f5e',
  mid: '#f59e0b',
  high: '#12b886',
}

/** Compact horizontal bar for tables */
export function BatteryBar({ soc, id, charging }: { soc: number; id?: string; charging?: boolean }) {
  const tone = socTone(soc)
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2.5 w-16 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200">
        <div
          className={cx('h-full rounded-full transition-[width] duration-700', fillByTone[tone], charging && 'charging-stripes')}
          style={{ width: `${soc}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-700 font-tabular">{soc}%</span>
      {id && <span className="font-mono text-[11px] text-slate-400">{id}</span>}
    </div>
  )
}

/** Radial gauge used in the rider portal */
export function BatteryRing({ soc, size = 132, label }: { soc: number; size?: number; label?: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  const tone = socTone(soc)
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-white/10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={strokeByTone[tone]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (soc / 100) * c}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 6px ${strokeByTone[tone]}88)` }}
        />
      </svg>
      <div className="text-center">
        <div className="font-display text-3xl font-bold text-white font-tabular">
          {soc}
          <span className="text-base text-white/60">%</span>
        </div>
        {label && <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-white/50">{label}</div>}
      </div>
    </div>
  )
}

/** Vertical battery pack drawing used inside kiosk boxes */
export function BatteryPack({ soc, id, compact }: { soc: number; id: string; compact?: boolean }) {
  const tone = socTone(soc)
  return (
    <div className={cx('flex flex-col items-center', compact ? 'gap-0.5' : 'gap-1')}>
      <div className="h-1 w-4 rounded-t bg-slate-500" />
      <div
        className={cx(
          'relative overflow-hidden rounded-md border-2 border-slate-600 bg-slate-800',
          compact ? 'h-9 w-6' : 'h-14 w-9',
        )}
      >
        <div
          className={cx('absolute inset-x-0 bottom-0 transition-[height] duration-700', fillByTone[tone])}
          style={{ height: `${soc}%` }}
        />
        <div className="absolute inset-0 grid place-items-center text-[9px] font-bold text-white drop-shadow">{soc}</div>
      </div>
      {!compact && <span className="font-mono text-[9px] font-semibold text-slate-300">{id}</span>}
    </div>
  )
}
