import type { ReactNode } from 'react'
import { BatteryPack } from '../../components/Battery'
import { Icon } from '../../components/Icon'
import { ZDiamond } from '../../components/Logo'
import { cx } from '../../lib/cx'
import type { Battery, SlotState } from '../../types'

export type BoxView = {
  no: number
  state: SlotState
  battery: Battery | null
  open: boolean
  target: boolean
  action?: { label: string; onClick: () => void } | null
}

const ledColor: Record<SlotState, string> = {
  empty: 'bg-slate-600',
  charging: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
  ready: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
  faulty: 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse',
}

/** Glass decoration — Z diamonds placed like the real machine */
const DIAMONDS: Array<{ x: string; y: string; s: string; o: number }> = [
  { x: '1%', y: '58%', s: '17%', o: 0.85 },
  { x: '12%', y: '42%', s: '13%', o: 0.85 },
  { x: '17%', y: '76%', s: '14%', o: 0.85 },
  { x: '-3%', y: '40%', s: '7%', o: 0.6 },
  { x: '73%', y: '70%', s: '10%', o: 0.85 },
  { x: '80%', y: '52%', s: '9%', o: 0.85 },
  { x: '84%', y: '74%', s: '13%', o: 0.85 },
  { x: '90%', y: '44%', s: '6%', o: 0.6 },
  { x: '68%', y: '55%', s: '6%', o: 0.6 },
  { x: '62%', y: '82%', s: '8%', o: 0.7 },
]

export function KioskMachine({
  screen,
  boxes,
  readerActive,
  onReaderClick,
}: {
  screen: ReactNode
  boxes: BoxView[]
  readerActive: boolean
  onReaderClick?: () => void
}) {
  return (
    <div className="relative mx-auto w-full max-w-[640px] select-none">
      {/* ---------- Upper glass section ---------- */}
      <div className="relative rounded-t-[56px] bg-gradient-to-b from-cream-100 to-cream-200 p-3.5 pb-2 shadow-[inset_0_2px_0_rgb(255_255_255/0.7),0_30px_60px_-20px_rgb(0_0_0/0.6)]">
        {/* side bolts */}
        {[18, 40, 62, 84].map((t) => (
          <span key={t} className="absolute left-1.5 size-1.5 rounded-full bg-cream-400" style={{ top: `${t}%` }} />
        ))}
        {[18, 40, 62, 84].map((t) => (
          <span key={`r${t}`} className="absolute right-1.5 size-1.5 rounded-full bg-cream-400" style={{ top: `${t}%` }} />
        ))}

        <div className="relative aspect-[16/9.4] overflow-hidden rounded-t-[44px] rounded-b-md bg-gradient-to-br from-[#121212] via-[#050505] to-[#151a1f] ring-1 ring-black">
          {/* reflection */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgb(255_255_255/0.06)_45%,transparent_55%)]" />

          {DIAMONDS.map((d, i) => (
            <div
              key={i}
              className="pointer-events-none absolute aspect-square text-cream-100"
              style={{ left: d.x, top: d.y, width: d.s, opacity: d.o }}
            >
              <ZDiamond className="size-full" strokeWidth={7} />
            </div>
          ))}

          {/* Touch screen */}
          <div className="absolute left-1/2 top-[7%] h-[74%] w-[60%] -translate-x-1/2 rounded-lg bg-slate-300/90 p-[5px] shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_10px_30px_rgb(0_0_0/0.6)]">
            <div className="@container relative h-full w-full overflow-hidden rounded-[5px] bg-ink-950">{screen}</div>
          </div>

          {/* RFID reader pad */}
          <button
            type="button"
            onClick={onReaderClick}
            aria-label="RFID reader"
            className={cx(
              'absolute right-[8%] top-[24%] grid w-[8%] aspect-[3/4] place-items-center rounded-md border transition',
              readerActive
                ? 'border-zeno-400/70 bg-zeno-400/10 text-zeno-300 shadow-[0_0_18px_rgb(52_211_155/0.45)]'
                : 'border-white/15 bg-white/5 text-white/40',
            )}
          >
            {readerActive && <span className="absolute inset-0 rounded-md border border-zeno-400/60 animate-pulse-ring" />}
            <Icon name="nfc" className="size-[60%]" />
          </button>
        </div>
      </div>

      {/* ---------- Lower box section ---------- */}
      <div className="relative -mt-px rounded-b-[28px] bg-gradient-to-b from-cream-200 via-cream-200 to-cream-300 px-5 pb-10 pt-5 shadow-[0_40px_60px_-25px_rgb(0_0_0/0.7)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-black/10 to-transparent" />
        <div
          className="grid gap-2.5 rounded-xl bg-cream-300/70 p-2.5 shadow-[inset_0_2px_6px_rgb(0_0_0/0.12)]"
          style={{ gridTemplateColumns: `repeat(${columnsFor(boxes.length)}, minmax(0, 1fr))` }}
        >
          {boxes.map((b) => (
            <Box key={b.no} box={b} />
          ))}
        </div>
        {/* plinth with vents */}
        <div className="absolute inset-x-6 bottom-2.5 flex justify-around">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="h-2 w-6 rounded-t-md bg-cream-400/80 shadow-inner" />
          ))}
        </div>
      </div>

      {/* pallet + floor shadow */}
      <div className="mx-auto -mt-1 h-3 w-[108%] -translate-x-[3.7%] rounded-sm bg-gradient-to-b from-[#c9a67a] to-[#a7825a]" />
      <div className="mx-auto h-4 w-[96%] bg-[repeating-linear-gradient(90deg,#8a6845_0_14%,transparent_14%_43%)]" />
      <div className="mx-auto mt-1 h-6 w-[90%] rounded-[50%] bg-black/50 blur-xl" />
    </div>
  )
}

/** At most 5 boxes per row, rows filled evenly (10 → 5×2, 8 → 4×2, 12 → 4×3) */
function columnsFor(count: number) {
  const rows = Math.ceil(count / 5)
  return Math.ceil(count / rows)
}

function Box({ box }: { box: BoxView }) {
  return (
    <div
      className={cx(
        'relative aspect-[4/5] rounded-md [perspective:700px]',
        box.target && 'z-10',
      )}
    >
      {/* cavity */}
      <div
        className={cx(
          'absolute inset-0 overflow-hidden rounded-md bg-gradient-to-b from-[#1b1f27] to-[#0b0e13] shadow-[inset_0_4px_10px_rgb(0_0_0/0.8)]',
          box.target && 'ring-2 ring-zeno-400 animate-glow',
        )}
      >
        <div className="absolute left-1/2 top-1.5 h-1 w-1/2 -translate-x-1/2 rounded-full bg-white/10" />
        <div className="flex h-full flex-col items-center justify-center gap-1 pt-2">
          {box.battery ? (
            <div className="animate-scale-in">
              <BatteryPack soc={box.battery.soc} id={box.battery.id} />
            </div>
          ) : (
            <span className="text-[9px] font-semibold uppercase tracking-wider text-white/25">empty</span>
          )}
        </div>
        {box.open && box.action && (
          <button
            type="button"
            onClick={box.action.onClick}
            className="absolute inset-x-1 bottom-1 rounded bg-zeno-500 px-1 py-1 text-[9px] font-bold uppercase leading-tight tracking-wide text-white shadow-lg transition hover:bg-zeno-400 animate-fade-up sm:text-[10px]"
          >
            {box.action.label}
          </button>
        )}
      </div>

      {/* door */}
      <div
        className={cx(
          'absolute inset-0 origin-left rounded-md border border-cream-400/60 bg-gradient-to-br from-cream-100 via-cream-100 to-cream-200 shadow-[0_2px_3px_rgb(0_0_0/0.15),inset_0_1px_0_rgb(255_255_255/0.8)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [backface-visibility:visible] [transform-style:preserve-3d]',
          box.open ? '[transform:rotateY(-108deg)] pointer-events-none' : '[transform:rotateY(0deg)]',
        )}
      >
        <span className="absolute left-1.5 top-1 text-[10px] font-bold text-cream-400">{box.no}</span>
        <span className={cx('absolute right-1.5 top-1.5 size-1.5 rounded-full', ledColor[box.state])} />
        <span className="absolute right-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-cream-300 shadow-inner" />
      </div>
    </div>
  )
}
