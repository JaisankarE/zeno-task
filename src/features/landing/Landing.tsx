import { Icon, type IconName } from '../../components/Icon'
import { Logo, ZDiamond } from '../../components/Logo'
import { ADMIN_CREDENTIALS } from '../../data/mock'
import { Link } from '../../components/Link'
import { useZenoStore } from '../../stores/useZenoStore'

const portals: Array<{
  to: string
  icon: IconName
  title: string
  body: string
  hint: string
  accent: string
}> = [
  {
    to: '/admin/login',
    icon: 'grid',
    title: 'Admin Console',
    body: 'Monitor stations, slots, every swap record and failure across the network.',
    hint: `${ADMIN_CREDENTIALS.username} / ${ADMIN_CREDENTIALS.password}`,
    accent: 'from-zeno-400/30 to-zeno-600/5',
  },
  {
    to: '/rider/login',
    icon: 'bike',
    title: 'Rider Portal',
    body: 'Riders log in with RFID + OTP to see battery %, swap history and pay bills.',
    hint: 'RFID RF-7A3F21C9 · OTP shown on screen',
    accent: 'from-sky-400/30 to-sky-600/5',
  },
  {
    to: '/kiosk/ZS-BLR-01',
    icon: 'monitor',
    title: 'Swap Station Kiosk',
    body: 'Interactive 10-box machine: tap card → Collect → Exchange → Dispense.',
    hint: 'Koramangala Hub · ZS-BLR-01',
    accent: 'from-amber-300/30 to-amber-500/5',
  },
]

export function Landing() {
  const swaps = useZenoStore((s) => s.swaps.length)
  const stations = useZenoStore((s) => s.stations)
  const online = stations.filter((s) => s.status === 'online').length
  const ready = stations.reduce((n, s) => n + s.slots.filter((x) => x.state === 'ready').length, 0)

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-white grid-glow">
      <ZDiamond className="pointer-events-none absolute -right-24 top-24 size-[420px] text-white/[0.03] animate-float" strokeWidth={3} />
      <ZDiamond className="pointer-events-none absolute -left-20 bottom-0 size-72 text-zeno-400/[0.06]" strokeWidth={3} />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center gap-3 animate-fade-in">
          <Logo subtitle="Battery Swap Network" />
          <span className="ml-auto hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-zeno-400 animate-pulse-ring" />
              <span className="relative inline-flex size-2 rounded-full bg-zeno-400" />
            </span>
            {online} stations live
          </span>
          <a
            href="/me"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-zeno-400/40 hover:text-white max-sm:ml-auto"
          >
            <Icon name="user" className="size-3.5" /> About me
          </a>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zeno-400 animate-fade-up">
            Swap. Ride. Repeat.
          </p>
          <h1
            className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl animate-fade-up"
            style={{ animationDelay: '80ms' }}
          >
            Two batteries swapped in{' '}
            <span className="bg-gradient-to-r from-zeno-300 to-sky-300 bg-clip-text text-transparent">under 90 seconds.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 animate-fade-up" style={{ animationDelay: '160ms' }}>
            Tap your RFID card, drop your drained packs, collect fully charged ones. Every swap and failure is tracked
            in real time across the network.
          </p>

          <div className="mt-8 flex flex-wrap gap-6 text-sm animate-fade-up" style={{ animationDelay: '220ms' }}>
            {[
              [String(swaps), 'swap records'],
              [String(stations.length), 'stations'],
              [String(ready), 'charged batteries ready'],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="font-display text-2xl font-bold text-white font-tabular">{v}</div>
                <div className="text-slate-500">{l}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {portals.map((p, i) => (
              <Link
                key={p.to}
                to={p.to}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] animate-fade-up"
                style={{ animationDelay: `${300 + i * 90}ms` }}
              >
                <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${p.accent} opacity-60 transition group-hover:opacity-100`} />
                <div className="relative">
                  <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
                    <Icon name={p.icon} className="size-5" />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold">{p.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{p.body}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="rounded-lg bg-black/30 px-2 py-1 font-mono text-[11px] text-slate-300">{p.hint}</span>
                    <Icon name="arrowRight" className="size-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-5 text-xs text-slate-500">
          <span>Zeno EV · Assessment demo with mock data</span>
          <span>Swap ID = Bat1 ID + Bat2 ID · Collect → Exchange → Dispense</span>
        </footer>
      </div>
    </div>
  )
}
