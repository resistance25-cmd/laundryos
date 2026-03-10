// src/app/admin/customers/[userId]/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronLeft, Package } from 'lucide-react'
import type { Metadata } from 'next'
import type { OrderStatus } from '@/types'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Customer Detail' }

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

export default async function CustomerDetailPage({ params }: { params: { userId: string } }) {
  const adminClient = createAdminClient()

  const [userRes, ordersRes, subRes] = await Promise.all([
    adminClient.from('users').select('*, zone:zones(name)').eq('id', params.userId).single(),
    adminClient.from('orders').select('id, order_number, status, total, pickup_date, created_at').eq('user_id', params.userId).order('created_at', { ascending: false }).limit(20),
    adminClient.from('user_subscriptions').select('*, plan:subscription_plans(name, price)').eq('user_id', params.userId).order('created_at', { ascending: false }).limit(5),
  ])

  if (!userRes.data) notFound()

  type UserRow = { id: string; name: string; phone: string; email: string | null; wallet_balance: number; referral_code: string; created_at: string; zone: { name: string } | { name: string }[] | null }
  type OrderRow = { id: string; order_number: string; status: string; total: number; pickup_date: string; created_at: string }
  type SubRow = { id: string; status: string; starts_at: string; expires_at: string; plan: { name: string; price: number } | { name: string; price: number }[] | null }

  const user = userRes.data as unknown as UserRow
  const orders = (ordersRes.data || []) as unknown as OrderRow[]
  const subs = (subRes.data || []) as unknown as SubRow[]
  const zone = first(user.zone)
  const totalSpend = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin/customers" className="p-2 rounded-lg" style={{ background: '#13151C', color: '#94A3B8' }} aria-label="Back">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
            style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}>
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>{user.name}</h1>
            <p className="text-xs" style={{ color: '#64748B' }}>{user.phone}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <div className="admin-card rounded-xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748B' }}>Profile</h3>
          {[
            { label: 'Email', value: user.email || '—' },
            { label: 'Zone', value: zone?.name || '—' },
            { label: 'Wallet', value: `₹${user.wallet_balance}` },
            { label: 'Referral Code', value: user.referral_code },
            { label: 'Joined', value: format(new Date(user.created_at), 'd MMM yyyy') },
          ].map((row) => (
            <div key={row.label} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #1E2130' }}>
              <span className="text-xs" style={{ color: '#64748B' }}>{row.label}</span>
              <span className="text-xs font-medium" style={{ color: '#CBD5E1' }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="admin-card rounded-xl p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748B' }}>Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Orders', value: orders.length },
              { label: 'Completed', value: orders.filter((o) => o.status === 'delivered').length },
              { label: 'Total Spend', value: `₹${totalSpend}` },
              { label: 'Active Plan', value: subs.find((s) => s.status === 'active') ? 'Yes' : 'No' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: '#0F1117' }}>
                <p className="text-lg font-bold" style={{ color: '#F1F5F9' }}>{s.value}</p>
                <p className="text-xs" style={{ color: '#64748B' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {subs.length > 0 && (
        <div className="admin-card rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E2130' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Subscriptions</h3>
          </div>
          {subs.map((sub) => {
            const plan = first(sub.plan)
            return (
              <div key={sub.id} className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid #1E2130' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{plan?.name || 'Plan'}</p>
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    {format(new Date(sub.starts_at), 'd MMM')} — {format(new Date(sub.expires_at), 'd MMM yyyy')}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: sub.status === 'active' ? 'rgba(5,150,105,0.2)' : 'rgba(100,116,139,0.2)',
                    color: sub.status === 'active' ? '#059669' : '#94A3B8',
                  }}>
                  {sub.status}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="admin-card rounded-xl overflow-hidden">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E2130' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Order History</h3>
        </div>
        {orders.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: '#6366F1' }} />
            <p className="text-sm" style={{ color: '#64748B' }}>No orders</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = order.status as OrderStatus
            const colors = STATUS_COLORS[status]
            return (
              <Link key={order.id} href={`/admin/orders/${order.id}`}>
                <div className="flex items-center justify-between px-4 py-3 hover:bg-white hover:bg-opacity-5"
                  style={{ borderBottom: '1px solid #1E2130' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{order.order_number}</p>
                    <p className="text-xs" style={{ color: '#64748B' }}>{format(new Date(order.created_at), 'd MMM yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ background: colors.bg, color: colors.text }}>
                      {status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                      {order.total > 0 ? `₹${order.total}` : 'Sub'}
                    </span>
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
