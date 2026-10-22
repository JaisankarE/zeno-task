import { useEffect, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react'
import { useToastStore } from '../stores/useToastStore'
import { Icon, type IconName } from './Icon'

import { cx } from '../lib/cx'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  icon?: IconName
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zeno-500 disabled:opacity-50 active:scale-[0.98]',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-[15px]',
        variant === 'primary' &&
          'bg-zeno-500 text-white shadow-lg shadow-zeno-500/25 hover:bg-zeno-600 hover:shadow-zeno-600/30',
        variant === 'secondary' && 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
        variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700',
        variant === 'dark' && 'bg-ink-900 text-white hover:bg-ink-700',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        icon && <Icon name={icon} />
      )}
      {children}
    </button>
  )
}

export function Card({ className, children, style }: { className?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <section
      style={style}
      className={cx('rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)]', className)}
    >
      {children}
    </section>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export type Tone = 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'violet'

const toneClasses: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
}

const dotClasses: Record<Tone, string> = {
  green: 'bg-emerald-500',
  red: 'bg-rose-500',
  amber: 'bg-amber-500',
  blue: 'bg-sky-500',
  slate: 'bg-slate-400',
  violet: 'bg-violet-500',
}

export function Badge({ tone = 'slate', dot, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        toneClasses[tone],
      )}
    >
      {dot && <span className={cx('size-1.5 rounded-full', dotClasses[tone])} />}
      {children}
    </span>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'green',
  delay = 0,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: IconName
  tone?: Tone
  delay?: number
}) {
  return (
    <Card
      style={{ animationDelay: `${delay}ms` }}
      className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 animate-fade-up"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 font-display text-[26px] font-bold leading-none tracking-tight text-slate-900 font-tabular">
            {value}
          </p>
          {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
        </div>
        <span className={cx('grid size-10 place-items-center rounded-xl ring-1 ring-inset', toneClasses[tone])}>
          <Icon name={icon} className="size-5" />
        </span>
      </div>
    </Card>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; icon?: IconName; trailing?: ReactNode }

export function Input({ label, icon, trailing, className, id, ...rest }: InputProps) {
  const inputId = id ?? rest.name
  return (
    <label htmlFor={inputId} className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>}
      <span className="relative flex items-center">
        {icon && (
          <span className="pointer-events-none absolute left-3 text-slate-400">
            <Icon name={icon} />
          </span>
        )}
        <input
          id={inputId}
          className={cx(
            'h-11 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-zeno-500 focus:ring-4 focus:ring-zeno-500/15',
            icon ? 'pl-10' : 'pl-3.5',
            trailing ? 'pr-11' : 'pr-3.5',
            className,
          )}
          {...rest}
        />
        {trailing && <span className="absolute right-2">{trailing}</span>}
      </span>
    </label>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
}) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-900/30 backdrop-blur-[2px] animate-fade-in"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl animate-slide-in-right">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-slate-900">{title}</div>
            {subtitle && <div className="mt-1 text-sm text-slate-500">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <Icon name="x" />
          </button>
        </header>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      />
      <div className={cx('relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-scale-in', className)}>
        {children}
      </div>
    </div>
  )
}

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, onClose])
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon name={icon} className="size-6" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      {body && <p className="mt-1 max-w-xs text-xs text-slate-500">{body}</p>}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ value: T; label: string; count?: number }>
}) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            value === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span
              className={cx(
                'rounded-md px-1.5 text-[10px] font-tabular',
                value === o.value ? 'bg-zeno-50 text-zeno-700' : 'bg-slate-200/70 text-slate-500',
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur animate-slide-in-right"
        >
          <span
            className={cx(
              'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full',
              t.tone === 'success' && 'bg-emerald-50 text-emerald-600',
              t.tone === 'error' && 'bg-rose-50 text-rose-600',
              t.tone === 'info' && 'bg-sky-50 text-sky-600',
            )}
          >
            <Icon name={t.tone === 'success' ? 'check' : t.tone === 'error' ? 'alert' : 'info'} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{t.title}</p>
            {t.body && <p className="mt-0.5 text-xs leading-5 text-slate-500">{t.body}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="self-start text-slate-400 hover:text-slate-600" aria-label="Dismiss">
            <Icon name="x" />
          </button>
        </div>
      ))}
    </div>
  )
}
