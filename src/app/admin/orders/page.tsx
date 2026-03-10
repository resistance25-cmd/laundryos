// src/app/admin/orders/page.tsx
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronRight, Filter } from 'lucide-react'
import type { OrderStatus } from '@/types'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Orders' }

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  placed:             { bg: 'rgba(100,116,139,0.2)', text: '#94A3B8' },
  pickup_scheduled:   { bg: 'rgba(99,102,241,0.15)', text: '#818CF8' },
  picked_up:          { bg: 'rgba(245,158,11,0.15)', text: '#FCD34D' },
  processing:         { bg: 'rgba(245,158,11,0.2)',  text: '#F59E0B' },
  ready_for_delivery: { bg: 'rgba(16,185,129,0.15)', text: '#34D399' },
  out_for_delivery:   { bg: 'rgba(99,102,241,0.2)',  text: '#6366F1' },
  delivered:          { bg: 'rgba(5,150,105,0.2)',   text: '#059669' },
  cancelled:          { bg: 'rgba(239,68,68,0.15)',  text: '#EF4444' },
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; date?: string; zone?: string }
}) {
  const adminClient = createAdminClient()

  let query = adminClient
    .from('orders')
    .select(`
      id, order_number, status, total, pickup_date, created_at, order_type, payment_status,
      user:users(id, name, phone),
      pickup_slot:pickup_slots(label),
      zone:zones(name),
      rider:riders!rider_id(id, name),
      delivery_rider:riders!delivery_rider_id(id, name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }
  if (searchParams.date) {
    query = query.eq('pickup_date', searchParams.date)
  }
  if (searchParams.zone) {
    query = query.eq('zone_id', searchParams.zone)
  }

  const { data: orders } = await query

  const ALL_STATUSES: OrderStatus[] = [
    'placed', 'pickup_scheduled', 'picked_up', 'processing',
    'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled',
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>Orders</h1>
        <p className="text-sm" style={{ color: '#64748B' }}>{orders?.length || 0} orders</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#64748B' }}>
          <Filter className="w-3.5 h-3.5" /> Filter:
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ label: 'All', value: 'all' }, ...ALL_STATUSES.map((s) => ({ label: s.replace(/_/g, ' '), value: s }))].map((opt) => (
            <Link key={opt.value}
              href={`/admin/orders?status=${opt.value}${searchParams.date ? `&date=${searchParams.date}` : ''}${searchParams.zone ? `&zone=${searchParams.zone}` : ''}`}>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer capitalize"
                style={{
                  background: (searchParams.status || 'all') === opt.value ? 'rgba(99,102,241,0.2)' : '#13151C',
                  color: (searchParams.status || 'all') === opt.value ? '#818CF8' : '#64748B',
                  border: '1px solid #1E2130',
                }}>
                {opt.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="admin-card rounded-xl overflow-hidden">
        <div className="hidden lg:grid grid-cols-6 gap-4 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#64748B', borderBottom: '1px solid #1E2130' }}>
          <span>Order</span><span>Customer</span><span>Pickup</span>
          <span>Status</span><span>Rider</span><span>Total</span>
        </div>

        {(!orders || orders.length === 0) ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm" style={{ color: '#64748B' }}>No orders found</p>
          </div>
        ) : (
          (orders as unknown as Record<string, unknown>[]).map((order) => {
            const status = order.status as OrderStatus
            const colors = STATUS_COLORS[status]
            const user = first(order.user as { name: string; phone: string } | { name: string; phone: string }[] | null)
            const pickupSlot = first(order.pickup_slot as { label: string } | { label: string }[] | null)
            const rider = first(order.rider as { id: string; name: string } | { id: string; name: string }[] | null)
            return (
              <Link key={order.id as string} href={`/admin/orders/${order.id as string}`}>
                <div className="grid lg:grid-cols-6 gap-2 lg:gap-4 px-4 py-3 hover:bg-white hover:bg-opacity-5 transition-colors"
                  style={{ borderBottom: '1px solid #1E2130' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{order.order_number as string}</p>
                    <p className="text-xs" style={{ color: '#64748B' }}>
                      {format(new Date(order.created_at as string), 'd MMM, h:mm a')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#CBD5E1' }}>{user?.name || '—'}</p>
                    <p className="text-xs" style={{ color: '#64748B' }}>{user?.phone || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#CBD5E1' }}>
                      {format(new Date(order.pickup_date as string), 'd MMM')}
                    </p>
                    <p className="text-xs" style={{ color: '#64748B' }}>{pickupSlot?.label || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{ background: colors.bg, color: colors.text }}>
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    {rider
                      ? <p className="text-sm" style={{ color: '#CBD5E1' }}>{rider.name}</p>
                      : <span className="text-xs" style={{ color: '#EF4444' }}>Unassigned</span>
                    }
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold" style={{ color: '#F1F5F9' }}>
                      {(order.total as number) > 0 ? `₹${order.total as number}` : 'Sub'}
                    </p>
                    <ChevronRight className="w-4 h-4 hidden lg:block" style={{ color: '#64748B' }} />
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
