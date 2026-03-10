'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ChevronLeft, Clock, Loader2, MapPin, Save, User } from 'lucide-react'
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
        const current = orderRes.data as unknown as OrderData
        setOrder(current)
        setSelectedStatus(current.status as OrderStatus)
        setSelectedRiderId(current.rider_id || '')
        setSelectedDeliveryRiderId(current.delivery_rider_id || '')
        setSelectedPartnerId(current.laundry_partner_id || '')
        setAdminNotes(current.admin_notes || '')
      }
      setRiders((ridersRes.data || []) as { id: string; name: string }[])
      setPartners((partnersRes.data || []) as { id: string; name: string }[])
      setStatusHistory((historyRes.data || []) as { status: string; created_at: string; changed_by_role: string | null }[])
      setLoading(false)
    }
    void load()
  }, [orderId, supabase])

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

      toast.success('Order updated')
      setOrder((prev) => prev ? { ...prev, status: selectedStatus, admin_notes: adminNotes } : null)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-sky-300" /></div>
  if (!order) return <div style={{ color: '#f87171' }}>Order not found</div>

  const user = first(order.user)
  const address = first(order.address)
  const pickupSlot = first(order.pickup_slot)
  const items = Array.isArray(order.items) ? order.items : []

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={() => { window.location.href = '/admin/orders' }} className="app-icon-wrap" aria-label="Back">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{order.order_number}</h1>
          <p className="text-sm" style={{ color: '#94A3B8' }}>{format(new Date(order.created_at), 'd MMM yyyy, h:mm a')}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="admin-card rounded-[28px] p-5">
          <div className="mb-4 flex items-center gap-2 text-sky-300"><User className="h-4 w-4" /> Customer</div>
          <div className="font-semibold text-white">{user?.name}</div>
          <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{user?.phone}</div>
          {user?.email ? <div className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{user.email}</div> : null}
        </section>

        <section className="admin-card rounded-[28px] p-5">
          <div className="mb-4 flex items-center gap-2 text-sky-300"><MapPin className="h-4 w-4" /> Pickup details</div>
          {address ? <div className="text-sm text-white">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</div> : null}
          <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}><Clock className="h-4 w-4" /> {format(new Date(order.pickup_date), 'd MMM')} • {pickupSlot?.label || '—'}</div>
        </section>

        <section className="admin-card rounded-[28px] p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Status and notes</h3>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)} className="admin-input mt-4 w-full">
            {ALL_STATUSES.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
          </select>
          <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Admin notes" rows={3} className="admin-input mt-3 w-full resize-none" />
        </section>

        <section className="admin-card rounded-[28px] p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Assignments</h3>
          <div className="mt-4 space-y-3">
            <select value={selectedRiderId} onChange={(e) => setSelectedRiderId(e.target.value)} className="admin-input w-full">
              <option value="">Pickup rider</option>
              {riders.map((rider) => <option key={rider.id} value={rider.id}>{rider.name}</option>)}
            </select>
            <select value={selectedDeliveryRiderId} onChange={(e) => setSelectedDeliveryRiderId(e.target.value)} className="admin-input w-full">
              <option value="">Delivery rider</option>
              {riders.map((rider) => <option key={rider.id} value={rider.id}>{rider.name}</option>)}
            </select>
            <select value={selectedPartnerId} onChange={(e) => setSelectedPartnerId(e.target.value)} className="admin-input w-full">
              <option value="">Laundry partner</option>
              {partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
            </select>
          </div>
        </section>

        <section className="admin-card rounded-[28px] overflow-hidden lg:col-span-2">
          <div className="border-b border-white/10 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Order items</div>
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-4" style={{ borderBottom: index < items.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div>
                <div className="text-sm font-semibold text-white">{item.quantity}x {item.item_name}</div>
                <div className="mt-1 text-sm capitalize" style={{ color: '#94A3B8' }}>{item.service_type.replace(/_/g, ' ')}</div>
              </div>
              <div className="text-sm font-bold text-white">Rs {item.total_price}</div>
            </div>
          ))}
          <div className="flex justify-between px-5 py-4 text-base font-bold text-white">
            <span>Total</span>
            <span style={{ color: '#7dd3fc' }}>{order.total > 0 ? `Rs ${order.total}` : 'Subscription'}</span>
          </div>
        </section>

        <section className="admin-card rounded-[28px] overflow-hidden lg:col-span-2">
          <div className="border-b border-white/10 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Status history</div>
          {statusHistory.map((entry, index) => (
            <div key={index} className="flex items-center justify-between px-5 py-4" style={{ borderBottom: index < statusHistory.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div className="text-sm capitalize text-white">{entry.status.replace(/_/g, ' ')}</div>
              <div className="text-right text-sm" style={{ color: '#94A3B8' }}>
                <div>{format(new Date(entry.created_at), 'h:mm a, d MMM')}</div>
                {entry.changed_by_role ? <div className="capitalize">{entry.changed_by_role}</div> : null}
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="mt-5 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save changes</>}
        </button>
      </div>
    </div>
  )
}
