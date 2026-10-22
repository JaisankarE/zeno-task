import type { SlotState } from '../types'

export const slotColors: Record<SlotState, string> = {
  empty: 'bg-slate-100 text-slate-400 ring-slate-200',
  charging: 'bg-amber-50 text-amber-700 ring-amber-200',
  ready: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  faulty: 'bg-rose-50 text-rose-700 ring-rose-200',
}
