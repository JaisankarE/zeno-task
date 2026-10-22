import { useEffect } from 'react'
import { Toaster } from '../components/ui'
import { AboutMe } from '../features/about/AboutMe'
import { AdminLayout } from '../features/admin/AdminLayout'
import { AdminLogin } from '../features/admin/AdminLogin'
import { CustomerDashboard } from '../features/customer/CustomerDashboard'
import { CustomerLogin } from '../features/customer/CustomerLogin'
import { KioskPage } from '../features/kiosk/KioskPage'
import { Landing } from '../features/landing/Landing'
import { navigate, useRoute } from '../lib/router'
import { useAuthStore } from '../stores/useAuthStore'

function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to), [to])
  return null
}

function Routes() {
  const path = useRoute()
  const admin = useAuthStore((s) => s.admin)
  const customerId = useAuthStore((s) => s.customerId)

  if (path === '/admin/login') return admin ? <Redirect to="/admin" /> : <AdminLogin />
  if (path.startsWith('/admin')) return admin ? <AdminLayout path={path} /> : <Redirect to="/admin/login" />

  if (path === '/rider/login') return customerId ? <Redirect to="/rider" /> : <CustomerLogin />
  if (path.startsWith('/rider')) return customerId ? <CustomerDashboard /> : <Redirect to="/rider/login" />

  if (path === '/me' || path === '/me/') return <AboutMe />

  if (path.startsWith('/kiosk')) {
    // e.g. /kiosk/ZS-BLR-01?rider=CU-0101 — opened from the rider portal with the card preselected
    const [route, query] = path.split('?')
    const riderId = new URLSearchParams(query).get('rider') ?? undefined
    return <KioskPage key={route} stationId={route.split('/')[2]} riderId={riderId} />
  }

  return <Landing />
}

export default function App() {
  return (
    <>
      <Routes />
      <Toaster />
    </>
  )
}
