import type { BatteryStatus, PaymentStatus, Station, SwapStatus } from '../types'
import { Badge, type Tone } from './ui'

const swapTone: Record<SwapStatus, [Tone, string]> = {
  success: ['green', 'Success'],
  failed: ['red', 'Failed'],
  aborted: ['amber', 'Aborted'],
}

export function SwapStatusBadge({ status }: { status: SwapStatus }) {
  const [tone, label] = swapTone[status]
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  )
}

const paymentTone: Record<PaymentStatus, [Tone, string]> = {
  paid: ['green', 'Paid'],
  pending: ['amber', 'Pending'],
  failed: ['red', 'Payment failed'],
  none: ['slate', 'No charge'],
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const [tone, label] = paymentTone[status]
  return <Badge tone={tone}>{label}</Badge>
}

const stationTone: Record<Station['status'], [Tone, string]> = {
  online: ['green', 'Online'],
  offline: ['red', 'Offline'],
  maintenance: ['amber', 'Maintenance'],
}

export function StationStatusBadge({ status }: { status: Station['status'] }) {
  const [tone, label] = stationTone[status]
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  )
}

const batteryTone: Record<BatteryStatus, [Tone, string]> = {
  'in-vehicle': ['blue', 'In vehicle'],
  charging: ['amber', 'Charging'],
  ready: ['green', 'Ready'],
  faulty: ['red', 'Faulty'],
}

export function BatteryStatusBadge({ status }: { status: BatteryStatus }) {
  const [tone, label] = batteryTone[status]
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  )
}

