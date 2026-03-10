'use client'

import Link from 'next/link'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  Clock3,
  CreditCard,
  Package,
  Plus,
  Shirt,
  Sparkles,
  Wallet,
  WashingMachine,
  Wind,
} from 'lucide-react'
import type { UserSubscription, OrderStatus } from '@/types'
import CustomerBottomNav from '@/components/app/CustomerBottomNav'

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
  pickup_scheduled: 'Pickup scheduled',
  picked_up: 'Picked up',
  processing: 'Processing',
  ready_for_delivery: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  placed: { bg: 'rgba(100,116,139,0.14)', text: '#94A3B8' },
  pickup_scheduled: { bg: 'rgba(47,111,237,0.14)', text: '#2F6FED' },
  picked_up: { bg: 'rgba(245,158,11,0.14)', text: '#D97706' },
  processing: { bg: 'rgba(14,165,164,0.14)', text: '#0F766E' },
  ready_for_delivery: { bg: 'rgba(34,197,94,0.14)', text: '#16A34A' },
  out_for_delivery: { bg: 'rgba(168,85,247,0.14)', text: '#9333EA' },
  delivered: { bg: 'rgba(22,163,74,0.14)', text: '#15803D' },
  cancelled: { bg: 'rgba(239,68,68,0.14)', text: '#DC2626' },
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

  const quickStats = [
    {
      label: 'Wallet balance',
      value: `Rs ${user.wallet_balance}`,
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      label: 'Live orders',
      value: `${activeOrders.length}`,
      icon: <Package className="h-5 w-5" />,
    },
  ]

  return (
    <div className="app-screen app-screen--customer">
      <header className="app-topbar safe-top">
        <div className="app-topbar__inner app-topbar__inner--phone">
          <div className="app-card__row">
            <div>
              <span className="app-kicker">Customer app</span>
              <h1 className="app-title">{getGreeting()}, {getFirstName(user.name)}</h1>
              <p className="app-subtitle">Everything you need for bookings, plans, tracking, and reorders now lives in one app-style home.</p>
            </div>
            <Link href="/profile" className="app-avatar" aria-label="Open profile">
              {user.name.charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      <main className="app-shell app-shell--phone">
        <section className="customer-hero">
          <div className="app-card__row" style={{ alignItems: 'flex-start' }}>
            <div>
              <p className="m-0 text-sm" style={{ opacity: 0.78 }}>Today&apos;s control center</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Book faster. Track cleaner. Stay in control.</h2>
            </div>
            <Link href="/book" className="app-pill" style={{ background: 'rgba(255,255,255,0.16)', color: 'white' }}>
              <Plus className="h-4 w-4" />
              New pickup
            </Link>
          </div>

          <div className="customer-quick-grid mt-5">
            {quickStats.map((stat) => (
              <div key={stat.label} className="customer-chip">
                <div className="flex items-center gap-2 text-sm" style={{ opacity: 0.82 }}>
                  {stat.icon}
                  <span>{stat.label}</span>
                </div>
                <div className="mt-2 text-2xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="customer-hero__chips mt-5">
            <div className="app-pill" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
              <Sparkles className="h-4 w-4" />
              Premium garment care
            </div>
            <div className="app-pill" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
              <Bell className="h-4 w-4" />
              Real-time order updates
            </div>
          </div>
        </section>

        <section className="app-section">
          {subscription ? (
            <div className="app-card app-card--accent">
              <div className="app-section__header">
                <div>
                  <p className="app-kicker">Membership</p>
                  <h3 className="m-0 mt-1 text-xl font-bold" style={{ color: 'var(--app-text)' }}>{first(subscription.plan)?.name} plan</h3>
                </div>
                <Link href="/subscription" className="app-action-link">Manage</Link>
              </div>
              <p className="app-note mt-2">
                {expiryDays > 0
                  ? `Expires in ${expiryDays} day${expiryDays !== 1 ? 's' : ''}`
                  : 'Expiring today'}
              </p>
              <div className="app-grid app-grid--3 mt-4">
                <div className="app-stat">
                  <div className="app-icon-wrap"><WashingMachine className="h-5 w-5" /></div>
                  <div className="app-stat__value">{subscription.wash_credits_remaining}</div>
                  <div className="app-stat__label">Wash credits</div>
                </div>
                <div className="app-stat">
                  <div className="app-icon-wrap"><Shirt className="h-5 w-5" /></div>
                  <div className="app-stat__value">{subscription.press_credits_remaining}</div>
                  <div className="app-stat__label">Press credits</div>
                </div>
                <div className="app-stat">
                  <div className="app-icon-wrap"><Wind className="h-5 w-5" /></div>
                  <div className="app-stat__value">{subscription.dry_clean_credits_remaining}</div>
                  <div className="app-stat__label">Dry clean</div>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/subscription" className="app-card app-card--warm block">
              <div className="app-card__row">
                <div>
                  <p className="app-kicker">Upgrade your routine</p>
                  <h3 className="m-0 mt-1 text-xl font-bold" style={{ color: 'var(--app-text)' }}>Add a plan and save on repeat laundry</h3>
                  <p className="app-note mt-2">Get smoother weekly bookings, lower pricing, and a cleaner credits experience.</p>
                </div>
                <ArrowUpRight className="h-5 w-5" style={{ color: 'var(--app-warm)' }} />
              </div>
            </Link>
          )}
        </section>

        <section className="app-section">
          <div className="app-grid app-grid--2">
            <Link href="/book" className="app-card block">
              <div className="app-icon-wrap"><Plus className="h-5 w-5" /></div>
              <h3 className="mt-4 text-lg font-bold" style={{ color: 'var(--app-text)' }}>Book pickup</h3>
              <p className="app-note mt-1">Choose items, address, slot, and payment in a smoother mobile flow.</p>
            </Link>
            <Link href="/orders" className="app-card block">
              <div className="app-icon-wrap"><Clock3 className="h-5 w-5" /></div>
              <h3 className="mt-4 text-lg font-bold" style={{ color: 'var(--app-text)' }}>Track orders</h3>
              <p className="app-note mt-1">Watch your active jobs move from pickup to delivery without hunting around.</p>
            </Link>
          </div>
        </section>

        {activeOrders.length > 0 && (
          <section className="app-section">
            <div className="app-section__header">
              <h2 className="app-section__title">Active orders</h2>
              <Link href="/orders" className="app-action-link">View all</Link>
            </div>
            <div className="app-list">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        <section className="app-section">
          <div className="app-section__header">
            <h2 className="app-section__title">Recent activity</h2>
            <Link href="/orders" className="app-action-link">Order history</Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="app-list">
              {recentOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="app-card app-empty">
              <Package className="h-12 w-12" />
              <h3 className="text-lg font-bold" style={{ color: 'var(--app-text)' }}>No orders yet</h3>
              <p className="app-note mt-2">Your first pickup will show up here with cleaner status updates and quick actions.</p>
              <Link href="/book" className="btn-primary mt-5">Book your first pickup</Link>
            </div>
          ) : null}
        </section>
      </main>

      <CustomerBottomNav active="home" />
    </div>
  )
}

function OrderCard({ order }: { order: DashboardOrder }) {
  const colors = STATUS_COLORS[order.status]

  return (
    <Link href={`/orders/${order.id}`} className="app-card block">
      <div className="app-card__row">
        <div className="flex items-center gap-3">
          <div className="app-icon-wrap">
            {order.total > 0 ? <CreditCard className="h-5 w-5" /> : <WashingMachine className="h-5 w-5" />}
          </div>
          <div>
            <div className="font-bold" style={{ color: 'var(--app-text)' }}>{order.order_number}</div>
            <div className="app-meta mt-1 flex items-center gap-1 text-sm">
              <Clock3 className="h-3.5 w-3.5" />
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4" style={{ color: 'var(--app-text-muted)' }} />
      </div>
      <div className="app-card__row mt-4">
        <span className="status-pill" style={{ background: colors.bg, color: colors.text }}>
          {STATUS_LABELS[order.status]}
        </span>
        <span className="text-sm font-bold" style={{ color: 'var(--app-text)' }}>
          {order.total > 0 ? `Rs ${order.total}` : 'Subscription'}
        </span>
      </div>
      {order.pickup_slot?.label && (
        <p className="app-note mt-3">Pickup window: {order.pickup_slot.label}</p>
      )}
    </Link>
  )
}

