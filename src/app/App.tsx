import { useEffect } from 'react'
import { Toaster } from '../components/ui'
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

  if (path.startsWith('/kiosk')) return <KioskPage stationId={path.split('/')[2]} />

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
