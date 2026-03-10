// src/app/admin/orders/[orderId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ChevronLeft, Loader2, User, MapPin, Clock, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import type { OrderStatus } from '@/types'

function first<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

const ALL_STATUSES: OrderStatus[] = [
  'placed', 'pickup_scheduled', 'picked_up', 'processing',
  'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled',
]

type OrderData = {
  id: string; order_number: string; status: string; total: number; pickup_date: string; created_at: string
  rider_id: string | null; delivery_rider_id: string | null; laundry_partner_id: string | null; admin_notes: string | null
  user: { name: string; phone: string; email: string } | { name: string; phone: string; email: string }[] | null
  address: { line1: string; line2: string | null; landmark: string | null } | { line1: string; line2: string | null; landmark: string | null }[] | null
  pickup_slot: { label: string } | { label: string }[] | null
  items: { id: string; item_name: string | null; service_type: string; quantity: number; total_price: number }[]
}

export default function AdminOrderDetailPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params
  const [order, setOrder] = useState<OrderData | null>(null)
  const [riders, setRiders] = useState<{ id: string; name: string }[]>([])
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([])
  const [statusHistory, setStatusHistory] = useState<{ status: string; created_at: string; changed_by_role: string | null }[]>([])
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('placed')
  const [selectedRiderId, setSelectedRiderId] = useState<string>('')
  const [selectedDeliveryRiderId, setSelectedDeliveryRiderId] = useState<string>('')
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)

  const supabase = createClient()

  useEffect(() => {
    async function load(): Promise<void> {
      const [orderRes, ridersRes, partnersRes, historyRes] = await Promise.all([
        supabase.from('orders').select(`*, user:users(name, phone, email), address:addresses(line1, line2, landmark), pickup_slot:pickup_slots(label), items:order_items(*)`).eq('id', orderId).single(),
        supabase.from('riders').select('id, name').eq('is_active', true),
        supabase.from('laundry_partners').select('id, name').eq('is_active', true),
        supabase.from('order_status_history').select('status, created_at, changed_by_role').eq('order_id', orderId).order('created_at', { ascending: false }),
      ])

      if (orderRes.data) {
        const o = orderRes.data as unknown as OrderData
        setOrder(o)
        setSelectedStatus(o.status as OrderStatus)
        setSelectedRiderId(o.rider_id || '')
        setSelectedDeliveryRiderId(o.delivery_rider_id || '')
        setSelectedPartnerId(o.laundry_partner_id || '')
        setAdminNotes(o.admin_notes || '')
      }
      setRiders((ridersRes.data || []) as { id: string; name: string }[])
      setPartners((partnersRes.data || []) as { id: string; name: string }[])
      setStatusHistory((historyRes.data || []) as { status: string; created_at: string; changed_by_role: string | null }[])
      setLoading(false)
    }
    void load()
  }, [orderId])

  async function handleSave(): Promise<void> {
    if (saving || !order) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/orders/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: selectedStatus, changedBy: session?.user.id, changedByRole: 'admin', notes: adminNotes || undefined }),
      })
      if (!res.ok) { toast.error('Failed to update status'); return }

      const assignRes = await fetch('/api/orders/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, riderId: selectedRiderId || null, deliveryRiderId: selectedDeliveryRiderId || null, laundryPartnerId: selectedPartnerId || null }),
      })
      if (!assignRes.ok) { toast.error('Failed to update assignment'); return }

      toast.success('Order updated!')
      setOrder((prev) => prev ? { ...prev, status: selectedStatus, admin_notes: adminNotes } : null)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6366F1' }} />
    </div>
  )
  if (!order) return <div style={{ color: '#EF4444' }}>Order not found</div>

  const user = first(order.user)
  const address = first(order.address)
  const pickupSlot = first(order.pickup_slot)
  const items = Array.isArray(order.items) ? order.items : []

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => { window.location.href = '/admin/orders' }}
          className="p-2 rounded-lg" style={{ background: '#13151C', color: '#94A3B8' }} aria-label="Back">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>{order.order_number}</h1>
          <p className="text-xs" style={{ color: '#64748B' }}>
            {format(new Date(order.created_at), 'd MMM yyyy, h:mm a')}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="admin-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4" style={{ color: '#6366F1' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Customer</h3>
          </div>
          <p className="font-medium" style={{ color: '#F1F5F9' }}>{user?.name}</p>
          <p className="text-sm" style={{ color: '#64748B' }}>{user?.phone}</p>
          {user?.email && <p className="text-sm" style={{ color: '#64748B' }}>{user.email}</p>}
        </div>

        <div className="admin-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4" style={{ color: '#6366F1' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Pickup Details</h3>
          </div>
          {address && <p className="text-sm" style={{ color: '#CBD5E1' }}>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>}
          <div className="flex items-center gap-1.5 mt-2">
            <Clock className="w-3.5 h-3.5" style={{ color: '#64748B' }} />
            <p className="text-sm" style={{ color: '#64748B' }}>
              {format(new Date(order.pickup_date), 'd MMM')} · {pickupSlot?.label || '—'}
            </p>
          </div>
        </div>

        <div className="admin-card rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#94A3B8' }}>Status Override</h3>
          <select value={selectedStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value as OrderStatus)}
            className="admin-input w-full mb-3">
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <textarea value={adminNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminNotes(e.target.value)}
            placeholder="Admin notes (optional)" rows={2} className="admin-input w-full resize-none" />
        </div>

        <div className="admin-card rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#94A3B8' }}>Assignment</h3>
          <div className="space-y-2">
            <select value={selectedRiderId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRiderId(e.target.value)}
              className="admin-input w-full">
              <option value="">— Pickup Rider —</option>
              {riders.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select value={selectedDeliveryRiderId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDeliveryRiderId(e.target.value)}
              className="admin-input w-full">
              <option value="">— Delivery Rider —</option>
              {riders.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select value={selectedPartnerId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPartnerId(e.target.value)}
              className="admin-input w-full">
              <option value="">— Laundry Partner —</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="admin-card rounded-xl overflow-hidden lg:col-span-2">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E2130' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Order Items</h3>
          </div>
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: index < items.length - 1 ? '1px solid #1E2130' : 'none' }}>
              <div>
                <p className="text-sm" style={{ color: '#F1F5F9' }}>{item.quantity}× {item.item_name}</p>
                <p className="text-xs capitalize" style={{ color: '#64748B' }}>{item.service_type.replace(/_/g, ' ')}</p>
              </div>
              <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>₹{item.total_price}</p>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3">
            <span className="font-bold" style={{ color: '#F1F5F9' }}>Total</span>
            <span className="font-bold" style={{ color: '#6366F1' }}>
              {order.total > 0 ? `₹${order.total}` : 'Subscription'}
            </span>
          </div>
        </div>

        <div className="admin-card rounded-xl overflow-hidden lg:col-span-2">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E2130' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Status History</h3>
          </div>
          {statusHistory.map((h, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: i < statusHistory.length - 1 ? '1px solid #1E2130' : 'none' }}>
              <p className="text-sm capitalize" style={{ color: '#CBD5E1' }}>{h.status.replace(/_/g, ' ')}</p>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#64748B' }}>{format(new Date(h.created_at), 'h:mm a, d MMM')}</p>
                {h.changed_by_role && <p className="text-xs capitalize" style={{ color: '#475569' }}>{h.changed_by_role}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}
