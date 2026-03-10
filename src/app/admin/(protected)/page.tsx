// src/app/admin/page.tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, startOfDay, endOfDay, startOfMonth } from 'date-fns'
import Link from 'next/link'
import { Package, Users, CreditCard, Bike, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import type { OrderStatus } from '@/types'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Dashboard' }

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
    { label: "Today's Orders", value: todayOrdersRes.count || 0, sub: `${pendingOrdersRes.count || 0} pending`, icon: <Package className="w-6 h-6" />, color: '#6366F1' },
    { label: 'Active Subscriptions', value: activeSubsRes.count || 0, sub: 'currently active', icon: <CreditCard className="w-6 h-6" />, color: '#8B5CF6' },
    { label: 'Revenue Today', value: `₹${Math.round(todayRevenue)}`, sub: `₹${Math.round(monthRevenue)} this month`, icon: <CreditCard className="w-6 h-6" />, color: '#059669' },
    { label: 'Riders Online', value: onlineRidersRes.count || 0, sub: 'available now', icon: <Bike className="w-6 h-6" />, color: '#F59E0B' },
  ]

  type UnassignedOrder = { id: string; order_number: string; status: string; total: number; pickup_date: string; created_at: string; user: { name: string; phone: string } | { name: string; phone: string }[] | null; pickup_slot: { label: string } | { label: string }[] | null }
  type RecentOrder = { id: string; order_number: string; status: string; total: number; created_at: string; user: { name: string } | { name: string }[] | null }

  const unassigned = (unassignedOrdersRes.data || []) as unknown as UnassignedOrder[]
  const recent = (recentOrdersRes.data || []) as unknown as RecentOrder[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>{format(today, 'EEEE, d MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-card p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>{stat.value}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#64748B' }}>{stat.label}</p>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Unassigned orders */}
        <div className="admin-card rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1E2130' }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" style={{ color: '#F59E0B' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Needs Assignment</h2>
              {unassigned.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                  style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                  {unassigned.length}
                </span>
              )}
            </div>
            <Link href="/admin/orders" className="text-xs font-medium" style={{ color: '#6366F1' }}>View all</Link>
          </div>
          {unassigned.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm" style={{ color: '#64748B' }}>All orders assigned ✓</p>
            </div>
          ) : (
            unassigned.map((order) => {
              const user = first(order.user)
              return (
                <Link key={order.id} href={`/admin/orders/${order.id}`}>
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid #1E2130' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{order.order_number}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                        {user?.name} · {format(new Date(order.pickup_date), 'd MMM')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: '#F59E0B' }} />
                      <ChevronRight className="w-4 h-4" style={{ color: '#64748B' }} />
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Recent orders */}
        <div className="admin-card rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1E2130' }}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: '#6366F1' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Recent Orders</h2>
            </div>
            <Link href="/admin/orders" className="text-xs font-medium" style={{ color: '#6366F1' }}>View all</Link>
          </div>
          {recent.map((order) => {
            const status = order.status as OrderStatus
            const colors = STATUS_COLORS[status]
            const user = first(order.user)
            return (
              <Link key={order.id} href={`/admin/orders/${order.id}`}>
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid #1E2130' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{order.order_number}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{user?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{ background: colors.bg, color: colors.text }}>
                      {status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold" style={{ color: '#94A3B8' }}>
                      {order.total > 0 ? `₹${order.total}` : ''}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {(openTicketsRes.count || 0) > 0 && (
          <div className="admin-card rounded-xl p-4 flex items-center gap-3 lg:col-span-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.15)' }}>
              <AlertCircle className="w-5 h-5" style={{ color: '#EF4444' }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: '#F1F5F9' }}>
                {openTicketsRes.count} open support ticket{(openTicketsRes.count || 0) > 1 ? 's' : ''}
              </p>
              <p className="text-sm" style={{ color: '#64748B' }}>Waiting for response</p>
            </div>
            <Link href="/admin/support" className="text-sm font-semibold" style={{ color: '#6366F1' }}>
              View tickets →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
