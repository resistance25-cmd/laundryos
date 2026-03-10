// src/app/rider/orders/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import type { Metadata } from 'next'
import type { OrderStatus } from '@/types'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'My Orders' }

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  placed:             { bg: 'rgba(100,116,139,0.2)', text: '#94A3B8' },
  pickup_scheduled:   { bg: 'rgba(16,185,129,0.15)', text: '#34D399' },
  picked_up:          { bg: 'rgba(245,158,11,0.2)',  text: '#F59E0B' },
  processing:         { bg: 'rgba(245,158,11,0.2)',  text: '#F59E0B' },
  ready_for_delivery: { bg: 'rgba(16,185,129,0.2)',  text: '#10B981' },
  out_for_delivery:   { bg: 'rgba(99,102,241,0.2)',  text: '#818CF8' },
  delivered:          { bg: 'rgba(5,150,105,0.2)',   text: '#059669' },
  cancelled:          { bg: 'rgba(239,68,68,0.2)',   text: '#EF4444' },
}

export default async function RiderOrdersPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/rider/login')

  const { data: ordersData } = await supabase
    .from('orders')
    .select('id, order_number, status, pickup_date, total, user:users(name, phone), zone:zones(name)')
    .or(`rider_id.eq.${session.user.id},delivery_rider_id.eq.${session.user.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  type OrderRow = { id: string; order_number: string; status: string; pickup_date: string; total: number; user: { name: string; phone: string } | { name: string; phone: string }[] | null; zone: { name: string } | { name: string }[] | null }
  const orders = (ordersData || []) as unknown as OrderRow[]
  const completed = orders.filter((o) => o.status === 'delivered').length

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <header className="px-4 pt-12 pb-5">
        <h1 className="text-xl font-bold" style={{ color: '#F0FDF4' }}>Order History</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>{completed} deliveries completed</p>
      </header>

      <div className="px-4 space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: '#13202E', border: '1px solid #1E3040' }}>
            <p className="font-medium" style={{ color: '#F0FDF4' }}>No orders assigned yet</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = order.status as OrderStatus
            const colors = STATUS_COLORS[status] || STATUS_COLORS.placed
            const user = first(order.user)
            const zone = first(order.zone)
            return (
              <div key={order.id} className="rounded-2xl p-4"
                style={{ background: '#13202E', border: '1px solid #1E3040' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#F0FDF4' }}>{order.order_number}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                      {user?.name} · {zone?.name}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                    style={{ background: colors.bg, color: colors.text }}>
                    {status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs" style={{ color: '#64748B' }}>
                  📅 {format(new Date(order.pickup_date), 'd MMM yyyy')}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
