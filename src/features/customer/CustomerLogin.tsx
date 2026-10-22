import { config } from '../../config'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { Logo, ZDiamond } from '../../components/Logo'
import { Button, Input } from '../../components/ui'
import { cx } from '../../lib/cx'
import { maskPhone } from '../../lib/format'
import { Link } from '../../components/Link'
import { navigate } from '../../lib/router'
import { useAuthStore } from '../../stores/useAuthStore'
import { toast } from '../../stores/useToastStore'
import { useZenoStore } from '../../stores/useZenoStore'
import type { Customer } from '../../types'

const OTP_LENGTH = 6
const RESEND_SECONDS = config.otpResendSeconds

const newOtp = () => String(Math.floor(100000 + Math.random() * 900000))

export function CustomerLogin() {
  const customers = useZenoStore((s) => s.customers)
  const loginCustomer = useAuthStore((s) => s.loginCustomer)
  const [step, setStep] = useState<'rfid' | 'otp'>('rfid')
  const [rfid, setRfid] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [otp, setOtp] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => window.clearTimeout(t)
  }, [resendIn])

  const sendOtp = (c: Customer) => {
    const code = newOtp()
    setOtp(code)
    setDigits(Array(OTP_LENGTH).fill(''))
    setResendIn(RESEND_SECONDS)
    toast(
      { tone: 'info', title: `SMS to ${maskPhone(c.phone)}`, body: `Your Zeno login OTP is ${code}. Valid for 5 minutes. (demo)` },
      12000,
    )
    window.setTimeout(() => inputs.current[0]?.focus(), 50)
  }

  const submitRfid = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const value = rfid.trim().toUpperCase()
    if (!/^RF-[0-9A-F]{8}$/.test(value)) {
      setError('RFID format is RF- followed by 8 hex characters, e.g. RF-7A3F21C9.')
      return
    }
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      const c = customers.find((x) => x.rfid === value)
      if (!c) {
        setError('This RFID card is not registered with Zeno.')
        return
      }
      setCustomer(c)
      setStep('otp')
      sendOtp(c)
    }, 600)
  }

  const verify = (code: string) => {
    if (!customer) return
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      if (code === otp) {
        loginCustomer(customer.id)
        toast({ tone: 'success', title: `Hi ${customer.name.split(' ')[0]} 👋`, body: 'Your battery status is up to date.' })
        navigate('/rider')
      } else {
        setError('Incorrect OTP. Please try again.')
        setDigits(Array(OTP_LENGTH).fill(''))
        inputs.current[0]?.focus()
      }
    }, 600)
  }

  const setDigit = (i: number, raw: string) => {
    const chars = raw.replace(/\D/g, '')
    if (!chars) {
      const next = [...digits]
      next[i] = ''
      setDigits(next)
      return
    }
    const next = [...digits]
    chars.split('').slice(0, OTP_LENGTH - i).forEach((ch, k) => (next[i + k] = ch))
    setDigits(next)
    setError('')
    const focus = Math.min(i + chars.length, OTP_LENGTH - 1)
    inputs.current[focus]?.focus()
    if (next.every(Boolean)) verify(next.join(''))
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-5 py-10 grid-glow">
      <ZDiamond className="pointer-events-none absolute -left-16 top-10 size-72 text-zeno-400/[0.07] animate-float" strokeWidth={3} />
      <ZDiamond className="pointer-events-none absolute -right-20 bottom-0 size-96 text-white/[0.03]" strokeWidth={3} />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/">
            <Logo subtitle="Rider Portal" />
          </Link>
          <div className="flex gap-1.5">
            {['rfid', 'otp'].map((s, i) => (
              <span
                key={s}
                className={cx(
                  'h-1.5 rounded-full transition-all duration-500',
                  step === s ? 'w-8 bg-zeno-400' : i === 0 && step === 'otp' ? 'w-4 bg-zeno-400/50' : 'w-4 bg-white/15',
                )}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-2xl shadow-black/40 animate-scale-in">
          {step === 'rfid' ? (
            <form onSubmit={submitRfid} key="rfid" className="animate-fade-in">
              <div className="relative mx-auto grid size-20 place-items-center">
                <span className="absolute inset-0 rounded-full bg-zeno-400/30 animate-pulse-ring" />
                <span className="relative grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-zeno-400 to-zeno-700 text-white shadow-lg shadow-zeno-500/30">
                  <Icon name="nfc" className="size-8" />
                </span>
              </div>
              <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-slate-900">Sign in with RFID</h1>
              <p className="mt-1.5 text-center text-sm text-slate-500">
                Enter the ID printed on the back of your Zeno RFID card.
              </p>

              <div className="mt-7">
                <Input
                  label="RFID card number"
                  name="rfid"
                  icon="card"
                  placeholder="RF-XXXXXXXX"
                  value={rfid}
                  autoComplete="off"
                  className="font-mono uppercase tracking-wider"
                  onChange={(e) => {
                    setRfid(e.target.value)
                    setError('')
                  }}
                />
              </div>
              {error && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700 animate-fade-in">
                  <Icon name="alert" className="mt-0.5 size-3.5 shrink-0" /> {error}
                </p>
              )}
              <Button type="submit" size="lg" loading={loading} className="mt-5 w-full">
                Send OTP <Icon name="arrowRight" />
              </Button>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Demo RFID cards</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {customers.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setRfid(c.rfid)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-left transition hover:border-zeno-300 hover:bg-zeno-50"
                    >
                      <span className="block font-mono text-[11px] font-semibold text-slate-700">{c.rfid}</span>
                      <span className="block text-[10px] text-slate-400">{c.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <div key="otp" className="animate-slide-in-right">
              <button
                onClick={() => {
                  setStep('rfid')
                  setError('')
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                <Icon name="chevronLeft" className="size-3.5" /> Change card
              </button>
              <div className="mx-auto mt-4 grid size-16 place-items-center rounded-2xl bg-sky-50 text-sky-600">
                <Icon name="phone" className="size-7" />
              </div>
              <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-slate-900">Verify it's you</h1>
              <p className="mt-1.5 text-center text-sm text-slate-500">
                We sent a 6-digit code to <b className="text-slate-700">{customer && maskPhone(customer.phone)}</b>
              </p>
              <p className="mt-1 text-center font-mono text-xs text-slate-400">{customer?.rfid}</p>

              <div className="mt-7 flex justify-center gap-2">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el
                    }}
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    aria-label={`OTP digit ${i + 1}`}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus()
                    }}
                    className={cx(
                      'size-12 rounded-xl border text-center font-display text-xl font-bold text-slate-900 outline-none transition focus:border-zeno-500 focus:ring-4 focus:ring-zeno-500/15',
                      error ? 'border-rose-300 bg-rose-50/50' : d ? 'border-zeno-300 bg-zeno-50/40' : 'border-slate-200',
                    )}
                  />
                ))}
              </div>

              {error && <p className="mt-3 text-center text-xs font-medium text-rose-600 animate-shake">{error}</p>}

              <Button
                size="lg"
                loading={loading}
                disabled={!digits.every(Boolean)}
                onClick={() => verify(digits.join(''))}
                className="mt-6 w-full"
              >
                Verify & continue
              </Button>

              <div className="mt-4 flex items-center justify-between text-xs">
                <button
                  disabled={resendIn > 0}
                  onClick={() => customer && sendOtp(customer)}
                  className="font-semibold text-zeno-700 disabled:text-slate-400"
                >
                  {resendIn > 0 ? `Resend in 0:${String(resendIn).padStart(2, '0')}` : 'Resend OTP'}
                </button>
                <button
                  onClick={() => setDigit(0, otp)}
                  className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-500 hover:bg-slate-200"
                  title="Demo helper"
                >
                  demo: autofill {otp}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <Icon name="shield" className="size-3.5" /> Secured with RFID + one-time password
        </p>
      </div>
    </div>
  )
}
