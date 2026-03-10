// src/app/(customer)/dashboard/DashboardClient.tsx
'use client'

import Link from 'next/link'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import {
  Plus, Package, ChevronRight, Sparkles,
  WashingMachine, Wind, Shirt, Clock, Bell
} from 'lucide-react'
import type { UserSubscription, OrderStatus } from '@/types'

function first<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

interface DashboardOrder {
  id: string
  order_number: string
  status: OrderStatus
  total: number
  pickup_date: string
  created_at: string
  pickup_slot: { label: string } | null
}

interface DashboardUser {
  id: string
  name: string
  wallet_balance: number
  zone_id: string | null
}

interface Props {
  user: DashboardUser
  subscription: UserSubscription | null
  orders: DashboardOrder[]
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Confirmed',
  pickup_scheduled: 'Pickup Scheduled',
  picked_up: 'Picked Up',
  processing: 'Washing',
  ready_for_delivery: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  placed:               { bg: 'rgba(100,116,139,0.2)', text: '#94A3B8' },
  pickup_scheduled:     { bg: 'rgba(99,102,241,0.15)', text: '#818CF8' },
  picked_up:            { bg: 'rgba(245,158,11,0.15)', text: '#FCD34D' },
  processing:           { bg: 'rgba(245,158,11,0.2)',  text: '#F59E0B' },
  ready_for_delivery:   { bg: 'rgba(16,185,129,0.15)', text: '#34D399' },
  out_for_delivery:     { bg: 'rgba(99,102,241,0.2)',  text: '#6366F1' },
  delivered:            { bg: 'rgba(5,150,105,0.2)',   text: '#059669' },
  cancelled:            { bg: 'rgba(239,68,68,0.15)',  text: '#EF4444' },
}

const ACTIVE_STATUSES: OrderStatus[] = [
  'placed', 'pickup_scheduled', 'picked_up',
  'processing', 'ready_for_delivery', 'out_for_delivery',
]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFirstName(name: string): string {
  return name.split(' ')[0]
}

export default function DashboardClient({ user, subscription, orders }: Props) {
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
  const recentOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status))

  const expiryDays = subscription
    ? differenceInDays(new Date(subscription.expires_at), new Date())
    : 0

  return (
    <div className="customer-dark min-h-screen pb-24">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 pt-12 pb-4 glass-dark safe-top"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-sm" style={{ color: '#94A3B8' }}>{getGreeting()}</p>
            <h1 className="text-xl font-bold text-white">
              {getFirstName(user.name)} 👋
            </h1>
          </div>
          <Link
            href="/notifications"
            className="relative p-2 rounded-full"
            style={{ background: '#1A1E30' }}
          >
            <Bell className="w-5 h-5" style={{ color: '#94A3B8' }} />
          </Link>
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto space-y-5 pt-4">

        {/* Subscription Card */}
        {subscription ? (
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #3730A3 0%, #5B21B6 100%)' }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
              style={{ background: 'white' }} />
            <div className="absolute -bottom-12 -left-6 w-40 h-40 rounded-full opacity-10"
              style={{ background: 'white' }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">
                      {first(subscription.plan)?.name} Plan
                    </span>
                  </div>
                  <p className="text-white text-sm opacity-80">
                    {expiryDays > 0
                      ? `Expires in ${expiryDays} day${expiryDays !== 1 ? 's' : ''}`
                      : 'Expiring today'}
                  </p>
                </div>
                <Link
                  href="/subscription"
                  className="text-xs font-semibold text-white opacity-70 underline"
                >
                  Manage
                </Link>
              </div>

              {/* Credits */}
              <div className="grid grid-cols-3 gap-3">
                <CreditBadge
                  icon={<WashingMachine className="w-4 h-4" />}
                  label="Wash"
                  value={subscription.wash_credits_remaining}
                />
                <CreditBadge
                  icon={<Shirt className="w-4 h-4" />}
                  label="Press"
                  value={subscription.press_credits_remaining}
                />
                <CreditBadge
                  icon={<Wind className="w-4 h-4" />}
                  label="Dry Clean"
                  value={subscription.dry_clean_credits_remaining}
                />
              </div>
            </div>
          </div>
        ) : (
          /* No subscription — upsell */
          <Link href="/subscription">
            <div
              className="rounded-2xl p-5 flex items-center justify-between"
              style={{ background: '#10131F', border: '1.5px dashed #1E2340' }}
            >
              <div>
                <p className="font-semibold text-white">Get a Plan</p>
                <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
                  Save up to 40% on laundry
                </p>
              </div>
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        )}

        {/* Quick Book Button */}
        <Link href="/book" className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base">
          <Plus className="w-5 h-5" />
          Book a Pickup
        </Link>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#64748B' }}>
              Active Orders
            </h2>
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>
                Recent Orders
              </h2>
              <Link href="/orders" className="text-xs font-semibold" style={{ color: '#6366F1' }}>
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {orders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-14 h-14 mx-auto mb-4 opacity-30" style={{ color: '#6366F1' }} />
            <p className="font-semibold text-white">No orders yet</p>
            <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
              Book your first laundry pickup!
            </p>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <BottomNav active="home" />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function CreditBadge({ icon, label, value }: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
      <div className="flex justify-center mb-1 text-white opacity-80">{icon}</div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-white opacity-60">{label}</p>
    </div>
  )
}

function OrderRow({ order }: { order: DashboardOrder }) {
  const colors = STATUS_COLORS[order.status]
  return (
    <Link href={`/orders/${order.id}`}>
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: '#10131F', border: '1px solid #1E2340' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.15)' }}
          >
            <WashingMachine className="w-5 h-5" style={{ color: '#6366F1' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{order.order_number}</p>
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#64748B' }}>
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: colors.bg, color: colors.text }}
          >
            {STATUS_LABELS[order.status]}
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: '#64748B' }} />
        </div>
      </div>
    </Link>
  )
}

function BottomNav({ active }: { active: 'home' | 'book' | 'orders' | 'profile' }) {
  const items = [
    { key: 'home', label: 'Home', href: '/dashboard', icon: <WashingMachine className="w-5 h-5" /> },
    { key: 'book', label: 'Book', href: '/book', icon: <Plus className="w-5 h-5" /> },
    { key: 'orders', label: 'Orders', href: '/orders', icon: <Package className="w-5 h-5" /> },
    { key: 'profile', label: 'Profile', href: '/profile', icon: <Shirt className="w-5 h-5" /> },
  ] as const

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 safe-bottom glass-dark border-t"
      style={{ borderColor: '#1E2340' }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {items.map((item) => {
          const isActive = active === item.key
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
              style={{ color: isActive ? '#6366F1' : '#64748B' }}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
