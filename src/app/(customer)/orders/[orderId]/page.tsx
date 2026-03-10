// src/app/(customer)/orders/[orderId]/page.tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import OrderTracker from './OrderTracker'
import type { OrderStatus } from '@/types'

export const metadata: Metadata = { title: 'Order Tracker' }

type OrderTrackerOrder = {
  id: string
  order_number: string
  status: OrderStatus
  total: number
  pickup_date: string
  special_instructions: string | null
  payment_method: string | null
  order_type: string
  pickup_slot: { label: string; start_time: string; end_time: string } | null
  delivery_slot: { label: string } | null
  address: { line1: string; line2: string | null; landmark: string | null; area: string | null } | null
  rider: {
    id: string
    name: string
    phone: string
    vehicle_type: string | null
    vehicle_number: string | null
    rating: number
  } | null
  items: Array<{
    id: string
    service_type: string
    item_name: string | null
    quantity: number
    unit_price: number
    total_price: number
  }>
}

function first<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: raw } = await supabase
    .from('orders')
    .select(`
      *,
      pickup_slot:pickup_slots(label, start_time, end_time),
      delivery_slot:delivery_slots(label),
      address:addresses(line1, line2, landmark, area),
      rider:riders!rider_id(id, name, phone, vehicle_type, vehicle_number, rating),
      items:order_items(*)
    `)
    .eq('id', params.orderId)
    .eq('user_id', session.user.id)
    .single()

  if (!raw) notFound()

  // Normalize all joins from array to single object
  const order = {
    ...(raw as Record<string, unknown>),
    pickup_slot: first(raw.pickup_slot as unknown),
    delivery_slot: first(raw.delivery_slot as unknown),
    address: first(raw.address as unknown),
    rider: first(raw.rider as unknown),
    items: Array.isArray(raw.items) ? raw.items : (raw.items ? [raw.items] : []),
  }

  const { data: statusHistory } = await supabase
    .from('order_status_history')
    .select('status, created_at, notes')
    .eq('order_id', params.orderId)
    .order('created_at', { ascending: true })
  return <OrderTracker order={order as OrderTrackerOrder} statusHistory={(statusHistory || []) as { status: OrderStatus; created_at: string; notes: string | null }[]} />
}

