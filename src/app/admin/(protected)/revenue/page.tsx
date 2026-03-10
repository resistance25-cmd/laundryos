// src/app/admin/revenue/page.tsx
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { TrendingUp, CreditCard, Tag } from 'lucide-react'

export const metadata: Metadata = { title: 'Revenue' }

export default async function AdminRevenuePage() {
  const adminClient = createAdminClient()
  const now = new Date()

  // Fetch last 3 months of payments
  const threeMonthsAgo = startOfMonth(subMonths(now, 2)).toISOString()
  const { data: payments } = await adminClient
    .from('payments')
    .select('amount, created_at, status')
    .eq('status', 'success')
    .gte('created_at', threeMonthsAgo)
    .order('created_at', { ascending: true })

  // Aggregate by month
  const monthlyRevenue: Record<string, number> = {}
  for (let i = 2; i >= 0; i--) {
    const month = subMonths(now, i)
    const key = format(month, 'MMM yyyy')
    monthlyRevenue[key] = 0
  }
  ;(payments || []).forEach((p: { amount: number; created_at: string }) => {
    const key = format(new Date(p.created_at), 'MMM yyyy')
    if (monthlyRevenue[key] !== undefined) {
      monthlyRevenue[key] += p.amount
    }
  })

  const totalRevenue = Object.values(monthlyRevenue).reduce((s, v) => s + v, 0)
  const thisMonth = monthlyRevenue[format(now, 'MMM yyyy')] || 0
  const lastMonth = monthlyRevenue[format(subMonths(now, 1), 'MMM yyyy')] || 0
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0

  // Subscription vs order breakdown
  const { data: subPayments } = await adminClient
    .from('payments')
    .select('amount')
    .eq('status', 'success')
    .not('subscription_id', 'is', null)
    .gte('created_at', startOfMonth(now).toISOString())

  const { data: orderPayments } = await adminClient
    .from('payments')
    .select('amount')
    .eq('status', 'success')
    .not('order_id', 'is', null)
    .gte('created_at', startOfMonth(now).toISOString())

  const subRevenue = (subPayments || []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)
  const orderRevenue = (orderPayments || []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5" style={{ color: '#F1F5F9' }}>Revenue</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total (3 months)', value: `₹${Math.round(totalRevenue).toLocaleString('en-IN')}`, icon: <TrendingUp className="w-5 h-5" />, color: '#6366F1' },
          { label: 'This Month', value: `₹${Math.round(thisMonth).toLocaleString('en-IN')}`, icon: <CreditCard className="w-5 h-5" />, color: '#059669' },
          { label: 'MoM Growth', value: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`, icon: <TrendingUp className="w-5 h-5" />, color: growth >= 0 ? '#059669' : '#EF4444' },
          { label: 'Subscriptions', value: `₹${Math.round(subRevenue).toLocaleString('en-IN')}`, icon: <Tag className="w-5 h-5" />, color: '#8B5CF6' },
        ].map((stat) => (
          <div key={stat.label} className="admin-card rounded-xl p-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
              style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      <div className="admin-card rounded-xl overflow-hidden mb-5">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E2130' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Monthly Breakdown</h3>
        </div>
        {Object.entries(monthlyRevenue).map(([month, amount]) => {
          const maxVal = Math.max(...Object.values(monthlyRevenue), 1)
          const pct = (amount / maxVal) * 100
          return (
            <div key={month} className="px-4 py-3" style={{ borderBottom: '1px solid #1E2130' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm" style={{ color: '#CBD5E1' }}>{month}</span>
                <span className="text-sm font-bold" style={{ color: '#F1F5F9' }}>
                  ₹{Math.round(amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: '#1E2130' }}>
                <div className="h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* This month breakdown */}
      <div className="admin-card rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#94A3B8' }}>This Month by Type</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Subscriptions', value: subRevenue, color: '#8B5CF6' },
            { label: 'Per-Order', value: orderRevenue, color: '#6366F1' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-4 text-center" style={{ background: '#0F1117' }}>
              <p className="text-2xl font-bold" style={{ color: item.color }}>
                ₹{Math.round(item.value).toLocaleString('en-IN')}
              </p>
              <p className="text-xs mt-1" style={{ color: '#64748B' }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
