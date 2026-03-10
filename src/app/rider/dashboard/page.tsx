// src/app/rider/dashboard/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Loader2, MapPin, Package, CheckCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import type { OrderStatus } from '@/types'

function first<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

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
    if (!session) { window.location.href = '/rider/login'; return }

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#10B981' }} />
    </div>
  )

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <header className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#F0FDF4' }}>
              Hi, {rider?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>{format(new Date(), 'EEEE, d MMM')}</p>
          </div>
          <button onClick={() => void toggleAvailability()} disabled={togglingAvail}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
            style={{
              background: rider?.is_available ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
              border: `1.5px solid ${rider?.is_available ? '#10B981' : '#475569'}`,
              color: rider?.is_available ? '#10B981' : '#64748B',
            }}>
            {rider?.is_available
              ? <><ToggleRight className="w-5 h-5" /> Online</>
              : <><ToggleLeft className="w-5 h-5" /> Offline</>
            }
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Active Orders', value: activeOrders.length, icon: <Package className="w-4 h-4" />, color: '#10B981' },
            { label: 'Total Deliveries', value: rider?.total_deliveries || 0, icon: <CheckCircle className="w-4 h-4" />, color: '#6366F1' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-3" style={{ background: '#13202E', border: '1px solid #1E3040' }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: stat.color }}>{stat.icon}</span>
                <span className="text-xs" style={{ color: '#64748B' }}>{stat.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="px-4">
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#64748B' }}>
          Active Orders ({activeOrders.length})
        </h2>

        {activeOrders.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: '#13202E', border: '1px solid #1E3040' }}>
            <Package className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#10B981' }} />
            <p className="font-medium" style={{ color: '#F0FDF4' }}>No active orders</p>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((order) => {
              const status = order.status as OrderStatus
              const colors = STATUS_COLORS[status]
              const user = first(order.user)
              const address = first(order.address)
              const pickupSlot = first(order.pickup_slot)
              const zone = first(order.zone)
              const nextStatus = NEXT_STATUS[status]

              return (
                <div key={order.id} className="rounded-2xl overflow-hidden"
                  style={{ background: '#13202E', border: '1px solid #1E3040' }}>
                  <div className="px-4 py-2 flex items-center justify-between"
                    style={{ background: colors.bg }}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text }}>
                      {status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold" style={{ color: colors.text }}>{order.order_number}</span>
                  </div>

                  <div className="p-4">
                    <div className="mb-3">
                      <p className="font-semibold" style={{ color: '#F0FDF4' }}>{user?.name}</p>
                      <a href={`tel:${user?.phone}`} className="text-sm font-medium" style={{ color: '#10B981' }}>
                        📞 {user?.phone}
                      </a>
                    </div>

                    <div className="flex items-start gap-2 mb-3 text-sm" style={{ color: '#94A3B8' }}>
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} />
                      <div>
                        <p>{address?.line1}</p>
                        {address?.landmark && <p className="text-xs" style={{ color: '#64748B' }}>Near {address.landmark}</p>}
                        <p className="text-xs" style={{ color: '#64748B' }}>{zone?.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs" style={{ color: '#64748B' }}>
                      <span>📅 {format(new Date(order.pickup_date), 'd MMM')} · {pickupSlot?.label}</span>
                      {order.total > 0 && <span className="font-bold" style={{ color: '#F0FDF4' }}>₹{order.total}</span>}
                    </div>

                    {nextStatus && (
                      <button onClick={() => void updateOrderStatus(order.id, nextStatus)}
                        disabled={updatingStatus === order.id}
                        className="w-full mt-3 py-3 rounded-xl text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                        {updatingStatus === order.id
                          ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          : nextStatus === 'picked_up' ? '✅ Mark Picked Up'
                          : nextStatus === 'out_for_delivery' ? '🚴 Start Delivery'
                          : '✅ Mark Delivered'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
