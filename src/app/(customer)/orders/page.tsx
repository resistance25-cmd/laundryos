import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { CalendarDays, ChevronRight, Package, WashingMachine } from 'lucide-react'
import type { OrderStatus } from '@/types'
import CustomerBottomNav from '@/components/app/CustomerBottomNav'

export const metadata: Metadata = { title: 'My Orders' }

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Confirmed',
  pickup_scheduled: 'Pickup scheduled',
  picked_up: 'Picked up',
  processing: 'Processing',
  ready_for_delivery: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  placed: { bg: 'rgba(100,116,139,0.14)', text: '#94A3B8' },
  pickup_scheduled: { bg: 'rgba(47,111,237,0.14)', text: '#2F6FED' },
  picked_up: { bg: 'rgba(245,158,11,0.14)', text: '#D97706' },
  processing: { bg: 'rgba(14,165,164,0.14)', text: '#0F766E' },
  ready_for_delivery: { bg: 'rgba(34,197,94,0.14)', text: '#16A34A' },
  out_for_delivery: { bg: 'rgba(168,85,247,0.14)', text: '#9333EA' },
  delivered: { bg: 'rgba(22,163,74,0.14)', text: '#15803D' },
  cancelled: { bg: 'rgba(239,68,68,0.14)', text: '#DC2626' },
}

function first<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total, pickup_date, created_at, pickup_slot:pickup_slots(label)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="app-screen app-screen--customer">
      <header className="app-topbar safe-top">
        <div className="app-topbar__inner app-topbar__inner--phone">
          <span className="app-kicker">Customer orders</span>
          <h1 className="app-title">Your laundry timeline</h1>
          <p className="app-subtitle">Track pickups, processing, and delivery from a cleaner history view built for mobile.</p>
        </div>
      </header>

      <main className="app-shell app-shell--phone">
        {(!orders || orders.length === 0) ? (
          <div className="app-card app-empty">
            <Package className="h-14 w-14" />
            <h2 className="text-xl font-bold" style={{ color: 'var(--app-text)' }}>No orders yet</h2>
            <p className="app-note mt-2">Your future pickups, progress states, and payments will all appear here.</p>
            <Link href="/book" className="btn-primary mt-6">Book a pickup</Link>
          </div>
        ) : (
          <div className="app-list">
            {orders.map((order) => {
              const status = order.status as OrderStatus
              const colors = STATUS_COLORS[status]
              const pickupSlot = first(order.pickup_slot as { label: string } | { label: string }[] | null)

              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="app-card block">
                  <div className="app-card__row">
                    <div className="flex items-center gap-3">
                      <div className="app-icon-wrap">
                        <WashingMachine className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: 'var(--app-text)' }}>{order.order_number}</p>
                        <p className="app-meta mt-1 text-sm">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" style={{ color: 'var(--app-text-muted)' }} />
                  </div>

                  <div className="app-card__row mt-4" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <span className="status-pill" style={{ background: colors.bg, color: colors.text }}>
                        {STATUS_LABELS[status]}
                      </span>
                      <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--app-text-muted)' }}>
                        <CalendarDays className="h-4 w-4" />
                        <span>
                          {format(new Date(order.pickup_date), 'd MMM')}
                          {pickupSlot?.label ? ` • ${pickupSlot.label}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="text-base font-bold" style={{ color: 'var(--app-text)' }}>
                      {order.total > 0 ? `Rs ${order.total}` : 'Subscription'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <CustomerBottomNav active="orders" />
    </div>
  )
}

