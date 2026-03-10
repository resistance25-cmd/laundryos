import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { format } from 'date-fns'
import { Filter, Package, Search } from 'lucide-react'
import type { OrderStatus } from '@/types'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Orders' }

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  placed: { bg: 'rgba(100,116,139,0.2)', text: '#94A3B8' },
  pickup_scheduled: { bg: 'rgba(47,111,237,0.18)', text: '#BFDBFE' },
  picked_up: { bg: 'rgba(245,158,11,0.18)', text: '#FCD34D' },
  processing: { bg: 'rgba(14,165,164,0.18)', text: '#99F6E4' },
  ready_for_delivery: { bg: 'rgba(34,197,94,0.18)', text: '#86EFAC' },
  out_for_delivery: { bg: 'rgba(168,85,247,0.18)', text: '#D8B4FE' },
  delivered: { bg: 'rgba(22,163,74,0.18)', text: '#86EFAC' },
  cancelled: { bg: 'rgba(239,68,68,0.18)', text: '#FCA5A5' },
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

  if (searchParams.status && searchParams.status !== 'all') query = query.eq('status', searchParams.status)
  if (searchParams.date) query = query.eq('pickup_date', searchParams.date)
  if (searchParams.zone) query = query.eq('zone_id', searchParams.zone)

  const { data: orders } = await query

  const ALL_STATUSES: OrderStatus[] = [
    'placed', 'pickup_scheduled', 'picked_up', 'processing',
    'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled',
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <section className="admin-card rounded-[28px] p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="app-kicker">Operations queue</span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Orders and dispatch flow</h1>
            <p className="mt-2 text-sm" style={{ color: '#94A3B8' }}>{orders?.length || 0} orders in the current result set.</p>
          </div>
          <div className="app-pill" style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
            <Search className="h-4 w-4" /> Filter by state or pickup date
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <div className="app-pill" style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}>
            <Filter className="h-4 w-4" /> Status
          </div>
          {[{ label: 'All', value: 'all' }, ...ALL_STATUSES.map((status) => ({ label: status.replace(/_/g, ' '), value: status }))].map((option) => (
            <Link
              key={option.value}
              href={`/admin/orders?status=${option.value}${searchParams.date ? `&date=${searchParams.date}` : ''}${searchParams.zone ? `&zone=${searchParams.zone}` : ''}`}
              className="rounded-full px-3 py-2 text-xs font-bold capitalize"
              style={{
                background: (searchParams.status || 'all') === option.value ? 'rgba(110,165,255,0.18)' : 'rgba(255,255,255,0.05)',
                color: (searchParams.status || 'all') === option.value ? '#ffffff' : '#94A3B8',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 admin-card rounded-[28px] p-4 lg:p-5">
        {(!orders || orders.length === 0) ? (
          <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-12 text-center text-sm" style={{ color: '#94A3B8' }}>No orders found for the selected filters.</div>
        ) : (
          <div className="space-y-3">
            {(orders as unknown as Record<string, unknown>[]).map((order) => {
              const status = order.status as OrderStatus
              const colors = STATUS_COLORS[status]
              const user = first(order.user as { name: string; phone: string } | { name: string; phone: string }[] | null)
              const pickupSlot = first(order.pickup_slot as { label: string } | { label: string }[] | null)
              const rider = first(order.rider as { id: string; name: string } | { id: string; name: string }[] | null)

              return (
                <Link key={order.id as string} href={`/admin/orders/${order.id as string}`} className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid gap-3 lg:grid-cols-4 lg:gap-6">
                      <div>
                        <div className="font-bold text-white">{order.order_number as string}</div>
                        <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{format(new Date(order.created_at as string), 'd MMM, h:mm a')}</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{user?.name || '—'}</div>
                        <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{user?.phone || ''}</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{format(new Date(order.pickup_date as string), 'd MMM')}</div>
                        <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{pickupSlot?.label || 'No slot'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{rider?.name || 'Unassigned'}</div>
                        <div className="mt-1 text-sm" style={{ color: rider ? '#94A3B8' : '#FCA5A5' }}>{rider ? 'Assigned rider' : 'Needs assignment'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                      <span className="status-pill" style={{ background: colors.bg, color: colors.text }}>{status.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-bold text-white">{(order.total as number) > 0 ? `Rs ${order.total as number}` : 'Subscription'}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
