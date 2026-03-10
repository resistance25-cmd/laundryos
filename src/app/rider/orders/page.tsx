import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarDays, Package } from 'lucide-react'
import type { Metadata } from 'next'
import type { OrderStatus } from '@/types'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'My Orders' }

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  placed: { bg: 'rgba(100,116,139,0.18)', text: '#CBD5E1' },
  pickup_scheduled: { bg: 'rgba(22,163,74,0.18)', text: '#BBF7D0' },
  picked_up: { bg: 'rgba(245,158,11,0.18)', text: '#FCD34D' },
  processing: { bg: 'rgba(245,158,11,0.18)', text: '#FCD34D' },
  ready_for_delivery: { bg: 'rgba(14,165,164,0.18)', text: '#99F6E4' },
  out_for_delivery: { bg: 'rgba(47,111,237,0.18)', text: '#BFDBFE' },
  delivered: { bg: 'rgba(22,163,74,0.18)', text: '#BBF7D0' },
  cancelled: { bg: 'rgba(239,68,68,0.18)', text: '#FCA5A5' },
}

export default async function RiderOrdersPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

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
    <div className="app-screen app-screen--rider">
      <header className="app-topbar safe-top" style={{ background: 'rgba(8,19,29,0.72)', borderBottomColor: 'rgba(148,163,184,0.12)' }}>
        <div className="app-topbar__inner app-topbar__inner--phone">
          <span className="app-kicker">Rider history</span>
          <h1 className="app-title text-white">Assigned order history</h1>
          <p className="app-subtitle" style={{ color: '#9fb0c5' }}>{completed} deliveries completed so far.</p>
        </div>
      </header>

      <main className="app-shell app-shell--phone">
        {orders.length === 0 ? (
          <div className="rider-surface rounded-[28px] p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-emerald-300/70" />
            <p className="mt-3 font-semibold text-white">No orders assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = order.status as OrderStatus
              const colors = STATUS_COLORS[status] || STATUS_COLORS.placed
              const user = first(order.user)
              const zone = first(order.zone)
              return (
                <div key={order.id} className="rider-surface rounded-[28px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-white">{order.order_number}</div>
                      <div className="mt-1 text-sm text-slate-400">{user?.name} • {zone?.name}</div>
                    </div>
                    <span className="status-pill" style={{ background: colors.bg, color: colors.text }}>{status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                    <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-300" /> {format(new Date(order.pickup_date), 'd MMM yyyy')}</div>
                    {order.total > 0 ? <div className="font-semibold text-white">Rs {order.total}</div> : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
