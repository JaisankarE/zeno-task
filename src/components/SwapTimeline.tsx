import { cx } from '../lib/cx'
import { time } from '../lib/format'
import type { SwapStep } from '../types'
import { Icon } from './Icon'

export function SwapTimeline({ steps, dark }: { steps: SwapStep[]; dark?: boolean }) {
  return (
    <ol className="relative space-y-4">
      {steps.map((step, i) => {
        const last = i === steps.length - 1
        return (
          <li key={step.key} className="relative flex gap-3 animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            {!last && (
              <span
                className={cx(
                  'absolute left-[13px] top-7 h-[calc(100%-4px)] w-0.5',
                  step.ok ? 'bg-zeno-200' : dark ? 'bg-white/10' : 'bg-slate-200',
                )}
              />
            )}
            <span
              className={cx(
                'relative z-10 grid size-7 shrink-0 place-items-center rounded-full ring-4',
                step.ok
                  ? 'bg-zeno-500 text-white ' + (dark ? 'ring-zeno-500/15' : 'ring-zeno-50')
                  : 'bg-rose-500 text-white ' + (dark ? 'ring-rose-500/15' : 'ring-rose-50'),
              )}
            >
              <Icon name={step.ok ? 'check' : 'x'} className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className={cx('text-sm font-semibold', dark ? 'text-white' : 'text-slate-800')}>{step.label}</p>
                <span className={cx('font-mono text-[11px]', dark ? 'text-white/40' : 'text-slate-400')}>{time(step.at)}</span>
              </div>
              {(step.slot || step.batteryId) && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {step.slot && (
                    <span
                      className={cx(
                        'rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                        dark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      Box {step.slot}
                    </span>
                  )}
                  {step.batteryId && (
                    <span
                      className={cx(
                        'rounded-md px-1.5 py-0.5 font-mono text-[11px]',
                        dark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {step.batteryId}
                    </span>
                  )}
                </div>
              )}
              {step.note && (
                <p
                  className={cx(
                    'mt-1.5 rounded-lg px-2.5 py-1.5 text-xs',
                    step.ok
                      ? dark ? 'text-white/60' : 'text-slate-500'
                      : dark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700',
                  )}
                >
                  {step.note}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
