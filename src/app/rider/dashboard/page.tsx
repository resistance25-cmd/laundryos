'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { CheckCircle, Loader2, MapPin, Package, Phone, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import type { OrderStatus } from '@/types'

function first<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pickup_scheduled: { bg: 'rgba(22,163,74,0.18)', text: '#BBF7D0' },
  picked_up: { bg: 'rgba(245,158,11,0.18)', text: '#FCD34D' },
  ready_for_delivery: { bg: 'rgba(14,165,164,0.18)', text: '#99F6E4' },
  out_for_delivery: { bg: 'rgba(47,111,237,0.18)', text: '#BFDBFE' },
  delivered: { bg: 'rgba(34,197,94,0.18)', text: '#BBF7D0' },
  cancelled: { bg: 'rgba(239,68,68,0.18)', text: '#FCA5A5' },
  placed: { bg: 'rgba(100,116,139,0.18)', text: '#CBD5E1' },
  processing: { bg: 'rgba(245,158,11,0.18)', text: '#FCD34D' },
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pickup_scheduled: 'picked_up',
  ready_for_delivery: 'out_for_delivery',
  out_for_delivery: 'delivered',
}

type RiderData = { id: string; name: string; is_available: boolean; total_deliveries: number; rating: number }
type OrderRow = {
  id: string; order_number: string; status: string; pickup_date: string; total: number; order_type: string;
  user: { name: string; phone: string } | { name: string; phone: string }[] | null
  address: { line1: string; landmark: string | null } | { line1: string; landmark: string | null }[] | null
  pickup_slot: { label: string } | { label: string }[] | null
  zone: { name: string } | { name: string }[] | null
}

export default function RiderDashboardPage() {
  const [rider, setRider] = useState<RiderData | null>(null)
  const [activeOrders, setActiveOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [togglingAvail, setTogglingAvail] = useState<boolean>(false)

  const supabase = createClient()

  const loadData = useCallback(async (): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }

    const [riderRes, ordersRes] = await Promise.all([
      supabase.from('riders').select('id, name, is_available, total_deliveries, rating').eq('id', session.user.id).single(),
      supabase
        .from('orders')
        .select(`id, order_number, status, pickup_date, total, order_type,
          user:users(name, phone),
          address:addresses(line1, landmark),
          pickup_slot:pickup_slots(label),
          zone:zones(name)`)
        .or(`rider_id.eq.${session.user.id},delivery_rider_id.eq.${session.user.id}`)
        .in('status', ['pickup_scheduled', 'picked_up', 'ready_for_delivery', 'out_for_delivery'])
        .order('pickup_date', { ascending: true }),
    ])

    setRider(riderRes.data as RiderData | null)
    setActiveOrders((ordersRes.data || []) as unknown as OrderRow[])
    setLoading(false)
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  async function toggleAvailability(): Promise<void> {
    if (!rider || togglingAvail) return
    setTogglingAvail(true)
    const newVal = !rider.is_available
    await fetch('/api/riders/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 0, longitude: 0, isAvailable: newVal }),
    })
    setRider({ ...rider, is_available: newVal })
    toast.success(newVal ? 'You are now available' : 'You are now offline')
    setTogglingAvail(false)
  }

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    if (updatingStatus === orderId) return
    setUpdatingStatus(orderId)
    try {
      const res = await fetch('/api/orders/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus, changedByRole: 'rider' }),
      })
      if (!res.ok) { toast.error('Failed to update status'); return }
      await loadData()
      toast.success(`Marked as ${newStatus.replace(/_/g, ' ')}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setUpdatingStatus(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-300" />
      </div>
    )
  }

  return (
    <div className="app-screen app-screen--rider">
      <header className="app-topbar safe-top" style={{ background: 'rgba(8,19,29,0.72)', borderBottomColor: 'rgba(148,163,184,0.12)' }}>
        <div className="app-topbar__inner app-topbar__inner--phone">
          <span className="app-kicker">Rider workspace</span>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="app-title text-white">Hi, {rider?.name?.split(' ')[0]}</h1>
              <p className="app-subtitle" style={{ color: '#9fb0c5' }}>{format(new Date(), 'EEEE, d MMM')} • Stay ready for pickups and delivery transitions.</p>
            </div>
            <button
              onClick={() => void toggleAvailability()}
              disabled={togglingAvail}
              className="app-pill"
              style={{
                background: rider?.is_available ? 'rgba(22,163,74,0.18)' : 'rgba(148,163,184,0.14)',
                color: rider?.is_available ? '#bbf7d0' : '#cbd5e1',
              }}
            >
              {rider?.is_available ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              {rider?.is_available ? 'Online' : 'Offline'}
            </button>
          </div>
        </div>
      </header>

      <main className="app-shell app-shell--phone">
        <section className="rider-highlight rounded-[30px] p-6 text-white">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-white/75">Active jobs</p>
              <div className="mt-2 text-4xl font-extrabold tracking-tight">{activeOrders.length}</div>
            </div>
            <div>
              <p className="text-sm text-white/75">Completed deliveries</p>
              <div className="mt-2 text-4xl font-extrabold tracking-tight">{rider?.total_deliveries || 0}</div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-300">Assigned orders</h2>
            <span className="text-sm text-slate-400">{activeOrders.length} live</span>
          </div>

          {activeOrders.length === 0 ? (
            <div className="rider-surface rounded-[28px] p-10 text-center">
              <Package className="mx-auto h-12 w-12 text-emerald-300/70" />
              <h3 className="mt-4 text-xl font-bold text-white">No active orders</h3>
              <p className="mt-2 text-sm text-slate-400">As soon as a pickup or delivery is assigned, it will appear here with one-tap status actions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const status = order.status as OrderStatus
                const colors = STATUS_COLORS[status]
                const user = first(order.user)
                const address = first(order.address)
                const pickupSlot = first(order.pickup_slot)
                const zone = first(order.zone)
                const nextStatus = NEXT_STATUS[status]

                return (
                  <div key={order.id} className="rider-surface rounded-[28px] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="status-pill" style={{ background: colors.bg, color: colors.text }}>{status.replace(/_/g, ' ')}</span>
                        <div className="mt-3 text-lg font-bold text-white">{order.order_number}</div>
                        <div className="mt-1 text-sm text-slate-400">{format(new Date(order.pickup_date), 'd MMM')} • {pickupSlot?.label}</div>
                      </div>
                      {order.total > 0 ? <div className="text-sm font-bold text-white">Rs {order.total}</div> : null}
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                        <div className="font-bold text-white">{user?.name}</div>
                        <a href={`tel:${user?.phone}`} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                          <Phone className="h-4 w-4" />
                          {user?.phone}
                        </a>
                      </div>

                      <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-emerald-300" />
                          <div>
                            <div>{address?.line1}</div>
                            {address?.landmark ? <div className="mt-1 text-slate-400">Near {address.landmark}</div> : null}
                            <div className="mt-1 text-slate-400">{zone?.name}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {nextStatus && (
                      <button
                        onClick={() => void updateOrderStatus(order.id, nextStatus)}
                        disabled={updatingStatus === order.id}
                        className="btn-primary mt-5 w-full"
                        style={{ background: 'linear-gradient(135deg, #16a34a, #0f766e)' }}
                      >
                        {updatingStatus === order.id ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        ) : nextStatus === 'picked_up' ? (
                          <>Mark picked up <CheckCircle className="h-4 w-4" /></>
                        ) : nextStatus === 'out_for_delivery' ? (
                          'Start delivery'
                        ) : (
                          'Mark delivered'
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

