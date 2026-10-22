import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { Logo, ZDiamond } from '../../components/Logo'
import { Button, Input } from '../../components/ui'
import { ADMIN_CREDENTIALS } from '../../data/mock'
import { cx } from '../../lib/cx'
import { Link } from '../../components/Link'
import { navigate } from '../../lib/router'
import { useAuthStore } from '../../stores/useAuthStore'
import { toast } from '../../stores/useToastStore'

export function AdminLogin() {
  const loginAdmin = useAuthStore((s) => s.loginAdmin)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(0)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Enter username and password.')
      setShake((n) => n + 1)
      return
    }
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      if (loginAdmin(username, password)) {
        toast({ tone: 'success', title: 'Welcome back, Admin', body: 'Network overview is live.' })
        navigate('/admin')
      } else {
        setError('Invalid username or password.')
        setShake((n) => n + 1)
      }
    }, 700)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:flex-col grid-glow">
        <ZDiamond className="absolute -bottom-20 -right-16 size-[380px] text-white/[0.04] animate-float" strokeWidth={3} />
        <Link to="/">
          <Logo subtitle="Operations Console" />
        </Link>
        <div className="relative mt-auto max-w-md animate-fade-up">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Every box, every battery, <span className="text-zeno-400">every swap.</span>
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Track RFID sessions, slot health, battery state of charge and failure root causes across all Zeno swap
            stations.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ['10', 'boxes / station'],
              ['2', 'packs / bike'],
              ['<90s', 'avg swap'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-display text-xl font-bold">{v}</div>
                <div className="mt-1 text-[11px] text-slate-400">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <form
          key={shake}
          onSubmit={submit}
          className={cx('w-full max-w-sm animate-fade-up', shake > 0 && 'animate-shake')}
        >
          <div className="lg:hidden">
            <Logo tone="light" subtitle="Operations Console" />
          </div>
          <h2 className="mt-8 text-2xl font-bold tracking-tight text-slate-900 lg:mt-0">Admin sign in</h2>
          <p className="mt-1.5 text-sm text-slate-500">Use your operations credentials to continue.</p>

          <div className="mt-8 space-y-4">
            <Input
              label="Username"
              name="username"
              icon="user"
              autoComplete="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              label="Password"
              name="password"
              icon="lock"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              trailing={
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  <Icon name={show ? 'eyeOff' : 'eye'} />
                </button>
              }
            />
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 animate-fade-in">
              <Icon name="alert" /> {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">
            Sign in
          </Button>

          <button
            type="button"
            onClick={() => {
              setUsername(ADMIN_CREDENTIALS.username)
              setPassword(ADMIN_CREDENTIALS.password)
            }}
            className="mt-6 w-full rounded-xl border border-dashed border-zeno-300 bg-zeno-50/60 px-4 py-3 text-left text-xs text-zeno-800 transition hover:bg-zeno-50"
          >
            <span className="font-semibold">Demo credentials</span> — click to fill
            <span className="mt-1 block font-mono text-[12px]">
              {ADMIN_CREDENTIALS.username} / {ADMIN_CREDENTIALS.password}
            </span>
          </button>

          <Link to="/" className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
            <Icon name="chevronLeft" className="size-3.5" /> Back to home
          </Link>
        </form>
      </main>
    </div>
  )
}
