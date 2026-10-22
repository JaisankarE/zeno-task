/**
 * Business settings read from `.env` (restart `npm run dev` after editing it).
 * Every value falls back to the default below if the .env line is missing or invalid.
 */
const env = import.meta.env

const num = (key: string, fallback: number) => {
  const n = Number(env[key])
  return env[key] !== undefined && env[key] !== '' && Number.isFinite(n) ? n : fallback
}
const str = (key: string, fallback: string) => (env[key] ? String(env[key]) : fallback)
const bool = (key: string, fallback: boolean) =>
  env[key] === undefined || env[key] === '' ? fallback : ['true', '1', 'yes', 'on'].includes(String(env[key]).toLowerCase())
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)))

const batteriesPerBike = clamp(num('VITE_BATTERIES_PER_BIKE', 2), 1, 4)

export const config = {
  // Machine & swap flow
  batteriesPerBike,
  /** A swap needs one empty box plus one charged box per battery */
  boxesPerStation: clamp(num('VITE_BOXES_PER_STATION', 10), batteriesPerBike + 1, 20),
  openAllDoors: bool('VITE_OPEN_ALL_DOORS', false),
  allDoorsSeconds: num('VITE_ALL_DOORS_SECONDS', 90),

  // Billing
  tariffPerKwh: num('VITE_TARIFF_PER_KWH', 28),
  serviceFee: num('VITE_SERVICE_FEE', 15),
  packKwh: num('VITE_PACK_KWH', 1.8),

  // Kiosk timings
  doorSeconds: num('VITE_DOOR_SECONDS', 45),
  doorTimeoutDemoSeconds: num('VITE_DOOR_TIMEOUT_DEMO_SECONDS', 9),
  rfidVerifyMs: num('VITE_RFID_VERIFY_MS', 1300),
  welcomeScreenMs: num('VITE_WELCOME_SCREEN_MS', 2600),
  batteryCheckMs: num('VITE_BATTERY_CHECK_MS', 1500),
  kioskResetSeconds: num('VITE_KIOSK_RESET_SECONDS', 25),

  // Charging
  chargeStepPercent: num('VITE_CHARGE_STEP_PERCENT', 2),
  chargeTickMs: num('VITE_CHARGE_TICK_MS', 2500),
  readySoc: num('VITE_READY_SOC', 96),

  // Battery thresholds
  socLow: num('VITE_SOC_LOW', 20),
  socMid: num('VITE_SOC_MID', 50),
  riderLowAlertSoc: num('VITE_RIDER_LOW_ALERT_SOC', 25),
  kmPerPercent: num('VITE_KM_PER_PERCENT', 0.55),

  // Rider portal
  otpResendSeconds: num('VITE_OTP_RESEND_SECONDS', 30),

  // Admin
  adminUsername: str('VITE_ADMIN_USERNAME', 'admin'),
  adminPassword: str('VITE_ADMIN_PASSWORD', 'zeno@123'),
  swapsPageSize: num('VITE_SWAPS_PAGE_SIZE', 12),

  // UI
  toastSeconds: num('VITE_TOAST_SECONDS', 4.5),
  kioskSubtitle: str('VITE_KIOSK_SUBTITLE', 'Station Kiosk Simulator'),
}
