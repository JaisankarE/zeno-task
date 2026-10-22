/** The "Z in a diamond" mark seen on the swap station glass */
export function ZDiamond({ className = 'size-8', strokeWidth = 6 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none" stroke="currentColor">
      <rect x="18" y="18" width="64" height="64" transform="rotate(45 50 50)" strokeWidth={strokeWidth} />
      <path d="M36 36h28L36 64h28" strokeWidth={strokeWidth} strokeLinejoin="miter" />
    </svg>
  )
}

export function Logo({ tone = 'dark', subtitle }: { tone?: 'dark' | 'light'; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-zeno-400 to-zeno-700 text-white shadow-lg shadow-zeno-600/30">
        <ZDiamond className="size-7" strokeWidth={7} />
      </span>
      <span className="leading-tight">
        <span
          className={`block font-display text-[17px] font-bold tracking-tight ${tone === 'dark' ? 'text-white' : 'text-slate-900'}`}
        >
          zeno<span className="text-zeno-400">swap</span>
        </span>
        {subtitle && (
          <span className={`block text-[11px] font-medium ${tone === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {subtitle}
          </span>
        )}
      </span>
    </div>
  )
}
