// src/app/(customer)/orders/page.tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { WashingMachine, ChevronRight, Package } from 'lucide-react'
import type { OrderStatus } from '@/types'

export const metadata: Metadata = { title: 'My Orders' }

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Confirmed', pickup_scheduled: 'Pickup Scheduled',
  picked_up: 'Picked Up', processing: 'Washing',
  ready_for_delivery: 'Ready', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', cancelled: 'Cancelled',
}
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

// Supabase returns joins as arrays — this helper safely gets the first item
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
    <div className="customer-dark min-h-screen pb-24">
      <header className="sticky top-0 z-10 glass-dark px-4 pt-12 pb-4 safe-top">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-white">My Orders</h1>
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto pt-4">
        {(!orders || orders.length === 0) ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: '#6366F1' }} />
            <p className="font-semibold text-white">No orders yet</p>
            <p className="text-sm mt-2" style={{ color: '#94A3B8' }}>Book your first pickup!</p>
            <Link href="/book" className="btn-primary inline-flex mt-6">Book Now</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = order.status as OrderStatus
              const colors = STATUS_COLORS[status]
              const pickupSlot = first(order.pickup_slot as { label: string } | { label: string }[] | null)
              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="rounded-2xl p-4" style={{ background: '#10131F', border: '1px solid #1E2340' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(99,102,241,0.15)' }}>
                          <WashingMachine className="w-5 h-5" style={{ color: '#6366F1' }} />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{order.order_number}</p>
                          <p className="text-xs" style={{ color: '#64748B' }}>
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5" style={{ color: '#64748B' }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: colors.bg, color: colors.text }}>
                        {STATUS_LABELS[status]}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {order.total > 0 ? `₹${order.total}` : 'Subscription'}
                      </span>
                    </div>
                    <p className="text-xs mt-2" style={{ color: '#64748B' }}>
                      Pickup: {format(new Date(order.pickup_date), 'd MMM')}
                      {pickupSlot?.label ? ` · ${pickupSlot.label}` : ''}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 safe-bottom glass-dark border-t" style={{ borderColor: '#1E2340' }}>
        <div className="flex items-center justify-around max-w-lg mx-auto h-16">
          {[
            { label: 'Home', href: '/dashboard', icon: '🏠' },
            { label: 'Book', href: '/book', icon: '➕' },
            { label: 'Orders', href: '/orders', icon: '📦', active: true },
            { label: 'Profile', href: '/profile', icon: '👤' },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-2"
              style={{ color: item.active ? '#6366F1' : '#64748B' }}>
              <span>{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
