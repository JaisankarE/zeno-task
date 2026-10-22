import { config } from '../../config'
import { useState } from 'react'
import { Icon, type IconName } from '../../components/Icon'
import { Logo } from '../../components/Logo'
import { Button, Modal } from '../../components/ui'
import { cx } from '../../lib/cx'
import { Link } from '../../components/Link'
import { navigate } from '../../lib/router'
import { useAuthStore } from '../../stores/useAuthStore'
import { toast } from '../../stores/useToastStore'
import { useZenoStore } from '../../stores/useZenoStore'
import { BatteriesPage } from './BatteriesPage'
import { CustomersPage } from './CustomersPage'
import { FailuresPage } from './FailuresPage'
import { OverviewPage } from './OverviewPage'
import { StationsPage } from './StationsPage'
import { SwapsPage } from './SwapsPage'

const NAV: Array<{ path: string; label: string; icon: IconName; title: string; subtitle: string }> = [
  { path: '/admin', label: 'Overview', icon: 'grid', title: 'Network overview', subtitle: 'Live health of swaps, stations and batteries' },
  { path: '/admin/swaps', label: 'Swap records', icon: 'swap', title: 'Swap records', subtitle: 'Every RFID session with Collect → Exchange → Dispense steps' },
  { path: '/admin/failures', label: 'Failures', icon: 'alert', title: 'Failure analysis', subtitle: 'Failed and aborted swaps, root causes and resolutions' },
  { path: '/admin/stations', label: 'Stations', icon: 'zap', title: 'Swap stations', subtitle: `${config.boxesPerStation}-box machines and live slot status` },
  { path: '/admin/customers', label: 'Customers', icon: 'users', title: 'Customers', subtitle: 'Riders, RFID cards and linked batteries' },
  { path: '/admin/batteries', label: 'Batteries', icon: 'battery', title: 'Battery fleet', subtitle: 'State of charge, health and location of every pack' },
]

export function AdminLayout({ path }: { path: string }) {
  const admin = useAuthStore((s) => s.admin)
  const logout = useAuthStore((s) => s.logoutAdmin)
  const resetDemo = useZenoStore((s) => s.resetDemo)
  const failedToday = useZenoStore(
    (s) => s.swaps.filter((x) => x.status !== 'success' && new Date(x.startedAt).toDateString() === new Date().toDateString()).length,
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const current = NAV.find((n) => n.path === path) ?? NAV[0]

  const page = (() => {
    switch (current.path) {
      case '/admin/swaps':
        return <SwapsPage />
      case '/admin/failures':
        return <FailuresPage />
      case '/admin/stations':
        return <StationsPage />
      case '/admin/customers':
        return <CustomersPage />
      case '/admin/batteries':
        return <BatteriesPage />
      default:
        return <OverviewPage />
    }
  })()

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-950 px-4 py-6 text-slate-300">
      <Link to="/" className="px-2">
        <Logo subtitle="Operations Console" />
      </Link>

      <nav className="mt-8 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Manage</p>
        {NAV.map((item) => {
          const active = item.path === current.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={cx(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                active ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
              )}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-zeno-400" />}
              <Icon name={item.icon} className={cx('size-[18px]', active ? 'text-zeno-400' : 'text-slate-500 group-hover:text-slate-300')} />
              {item.label}
              {item.path === '/admin/failures' && failedToday > 0 && (
                <span className="ml-auto rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                  {failedToday} today
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-zeno-500/15 to-transparent p-4">
        <p className="text-sm font-semibold text-white">Station kiosk simulator</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">Run a live swap — it lands in these records instantly.</p>
        <Link
          to="/kiosk/ZS-BLR-01"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-zeno-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zeno-400"
        >
          <Icon name="monitor" className="size-3.5" /> Open kiosk
        </Link>
      </div>

      <div className="mt-auto space-y-1 pt-6">
        <button
          onClick={() => setConfirmReset(true)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          <Icon name="refresh" className="size-[18px]" /> Reset demo data
        </button>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-zeno-500/20 text-xs font-bold uppercase text-zeno-300">
            {admin?.slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold capitalize text-white">{admin}</p>
            <p className="text-[11px] text-slate-500">Network admin</p>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/admin/login')
            }}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Log out"
            title="Log out"
          >
            <Icon name="logout" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 animate-slide-in-right">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-lg">
          <div className="flex items-center gap-3 px-5 py-4 sm:px-8">
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="menu" className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">{current.title}</h1>
              <p className="hidden truncate text-xs text-slate-500 sm:block">{current.subtitle}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 md:flex">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full rounded-full bg-zeno-400 animate-pulse-ring" />
                  <span className="relative inline-flex size-2 rounded-full bg-zeno-500" />
                </span>
                Live
              </span>
              <span className="hidden text-xs text-slate-500 md:block">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        <main key={current.path} className="px-5 py-6 sm:px-8 animate-fade-in">
          {page}
        </main>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <span className="grid size-11 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <Icon name="refresh" className="size-5" />
        </span>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">Reset demo data?</h3>
        <p className="mt-1.5 text-sm text-slate-500">
          This restores the original mock customers, stations, batteries and swap history. Kiosk swaps you ran will be
          removed.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              resetDemo()
              setConfirmReset(false)
              toast({ tone: 'success', title: 'Demo data restored' })
            }}
          >
            Reset data
          </Button>
        </div>
      </Modal>
    </div>
  )
}
