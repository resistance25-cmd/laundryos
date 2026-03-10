import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, startOfDay, endOfDay, startOfMonth } from 'date-fns'
import Link from 'next/link'
import { AlertCircle, ArrowUpRight, Bike, CreditCard, Package, Users } from 'lucide-react'
import type { OrderStatus } from '@/types'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Dashboard' }

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  placed: { bg: 'rgba(100,116,139,0.2)', text: '#94A3B8' },
  pickup_scheduled: { bg: 'rgba(47,111,237,0.18)', text: '#93C5FD' },
  picked_up: { bg: 'rgba(245,158,11,0.18)', text: '#FBBF24' },
  processing: { bg: 'rgba(14,165,164,0.18)', text: '#5EEAD4' },
  ready_for_delivery: { bg: 'rgba(34,197,94,0.18)', text: '#86EFAC' },
  out_for_delivery: { bg: 'rgba(168,85,247,0.18)', text: '#D8B4FE' },
  delivered: { bg: 'rgba(22,163,74,0.18)', text: '#86EFAC' },
  cancelled: { bg: 'rgba(239,68,68,0.18)', text: '#FCA5A5' },
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const today = new Date()
  const todayStart = startOfDay(today).toISOString()
  const todayEnd = endOfDay(today).toISOString()
  const monthStart = startOfMonth(today).toISOString()

  const [
    todayOrdersRes, pendingOrdersRes, activeSubsRes,
    todayRevenueRes, monthRevenueRes, onlineRidersRes,
    unassignedOrdersRes, openTicketsRes, recentOrdersRes,
  ] = await Promise.all([
    adminClient.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStart).lte('created_at', todayEnd),
    adminClient.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'placed'),
    adminClient.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').gt('expires_at', today.toISOString()),
    adminClient.from('payments').select('amount').eq('status', 'success').gte('created_at', todayStart).lte('created_at', todayEnd),
    adminClient.from('payments').select('amount').eq('status', 'success').gte('created_at', monthStart),
    adminClient.from('riders').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_available', true),
    adminClient.from('orders').select('id, order_number, status, total, pickup_date, created_at, user:users(name, phone), pickup_slot:pickup_slots(label)').is('rider_id', null).in('status', ['placed', 'pickup_scheduled']).order('created_at', { ascending: true }).limit(10),
    adminClient.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    adminClient.from('orders').select('id, order_number, status, total, created_at, user:users(name)').order('created_at', { ascending: false }).limit(8),
  ])

  const todayRevenue = (todayRevenueRes.data || []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)
  const monthRevenue = (monthRevenueRes.data || []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)

  const stats = [
    { label: "Today's orders", value: todayOrdersRes.count || 0, sub: `${pendingOrdersRes.count || 0} waiting`, icon: <Package className="w-6 h-6" /> },
    { label: 'Active plans', value: activeSubsRes.count || 0, sub: 'customers currently subscribed', icon: <CreditCard className="w-6 h-6" /> },
    { label: 'Revenue today', value: `Rs ${Math.round(todayRevenue)}`, sub: `Rs ${Math.round(monthRevenue)} this month`, icon: <CreditCard className="w-6 h-6" /> },
    { label: 'Riders online', value: onlineRidersRes.count || 0, sub: 'available now', icon: <Bike className="w-6 h-6" /> },
  ]

  type UnassignedOrder = { id: string; order_number: string; status: string; total: number; pickup_date: string; created_at: string; user: { name: string; phone: string } | { name: string; phone: string }[] | null; pickup_slot: { label: string } | { label: string }[] | null }
  type RecentOrder = { id: string; order_number: string; status: string; total: number; created_at: string; user: { name: string } | { name: string }[] | null }

  const unassigned = (unassignedOrdersRes.data || []) as unknown as UnassignedOrder[]
  const recent = (recentOrdersRes.data || []) as unknown as RecentOrder[]

  return (
    <div className="mx-auto max-w-7xl">
      <section className="admin-surface rounded-[32px] p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="app-kicker">Operations overview</span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Admin dashboard with a cleaner app feel</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: '#94A3B8' }}>{format(today, 'EEEE, d MMMM yyyy')} • watch team throughput, rider availability, and revenue without hopping between dated panels.</p>
          </div>
          <Link href="/admin/orders" className="btn-primary">Open order queue <ArrowUpRight className="h-4 w-4" /></Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="admin-card rounded-[24px] p-5">
              <div className="flex items-center justify-between">
                <div className="app-icon-wrap">{stat.icon}</div>
              </div>
              <div className="mt-5 text-3xl font-extrabold tracking-tight text-white">{stat.value}</div>
              <div className="mt-1 text-sm font-semibold text-white/90">{stat.label}</div>
              <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="admin-card rounded-[28px] p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Needs assignment</h2>
              <p className="mt-1 text-sm" style={{ color: '#94A3B8' }}>Orders still waiting to be claimed by a rider.</p>
            </div>
            <Link href="/admin/orders" className="app-action-link">View all</Link>
          </div>

          <div className="mt-5 space-y-3">
            {unassigned.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-8 text-center text-sm" style={{ color: '#94A3B8' }}>Everything is assigned right now.</div>
            ) : (
              unassigned.map((order) => {
                const user = first(order.user)
                return (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} className="block rounded-[22px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-white">{order.order_number}</div>
                        <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{user?.name} • {format(new Date(order.pickup_date), 'd MMM')}</div>
                      </div>
                      <span className="status-pill" style={{ background: 'rgba(245,158,11,0.18)', color: '#FBBF24' }}>Needs rider</span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </section>

        <section className="admin-card rounded-[28px] p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Recent orders</h2>
              <p className="mt-1 text-sm" style={{ color: '#94A3B8' }}>Latest activity across customer orders.</p>
            </div>
            <Users className="h-5 w-5 text-sky-300" />
          </div>

          <div className="mt-5 space-y-3">
            {recent.map((order) => {
              const status = order.status as OrderStatus
              const colors = STATUS_COLORS[status]
              const user = first(order.user)
              return (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="block rounded-[22px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-white">{order.order_number}</div>
                      <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{user?.name}</div>
                    </div>
                    <div className="text-right">
                      <span className="status-pill" style={{ background: colors.bg, color: colors.text }}>{status.replace(/_/g, ' ')}</span>
                      <div className="mt-2 text-sm font-semibold text-white">{order.total > 0 ? `Rs ${order.total}` : ''}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      {(openTicketsRes.count || 0) > 0 && (
        <section className="mt-6 admin-card rounded-[28px] p-5 lg:p-6">
          <div className="flex items-center gap-4">
            <div className="app-icon-wrap" style={{ background: 'rgba(239,68,68,0.14)', color: '#f87171' }}>
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">{openTicketsRes.count} support ticket{(openTicketsRes.count || 0) > 1 ? 's' : ''} need attention</div>
              <div className="text-sm" style={{ color: '#94A3B8' }}>Jump into the queue before the SLA starts slipping.</div>
            </div>
            <Link href="/admin/support" className="btn-primary">Open support</Link>
          </div>
        </section>
      )}
    </div>
  )
}

