// src/app/(customer)/orders/[orderId]/OrderTracker.tsx
'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ChevronLeft, Phone, MapPin, Package, Star, MessageCircle, CheckCircle, Circle, Clock } from 'lucide-react'
import type { OrderStatus } from '@/types'

interface StatusHistoryItem {
  status: OrderStatus
  created_at: string
  notes: string | null
}

interface OrderWithDetails {
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
    id: string; name: string; phone: string
    vehicle_type: string | null; vehicle_number: string | null; rating: number
  } | null
  items: Array<{
    id: string; service_type: string; item_name: string | null
    quantity: number; unit_price: number; total_price: number
  }>
}

interface Props {
  order: OrderWithDetails
  statusHistory: StatusHistoryItem[]
}

const ALL_STATUSES: OrderStatus[] = [
  'placed', 'pickup_scheduled', 'picked_up',
  'processing', 'ready_for_delivery', 'out_for_delivery', 'delivered',
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order Confirmed',
  pickup_scheduled: 'Pickup Scheduled',
  picked_up: 'Clothes Picked Up',
  processing: 'Laundry in Progress',
  ready_for_delivery: 'Ready for Delivery',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  placed: 'Your order has been confirmed',
  pickup_scheduled: 'A rider will pick up your clothes',
  picked_up: 'Clothes are on the way to our partner',
  processing: 'Your clothes are being washed',
  ready_for_delivery: 'Clean clothes are packed and ready',
  out_for_delivery: 'Rider is on the way to your address',
  delivered: 'Enjoy your fresh laundry!',
  cancelled: 'This order was cancelled',
}

export default function OrderTracker({ order, statusHistory }: Props) {
  const isCancelled = order.status === 'cancelled'
  const currentStatusIndex = ALL_STATUSES.indexOf(order.status)

  const getStatusTime = (status: OrderStatus): string | null => {
    const entry = statusHistory.find((h) => h.status === status)
    return entry ? format(new Date(entry.created_at), 'h:mm a, d MMM') : null
  }

  return (
    <div className="customer-dark min-h-screen pb-10">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-dark px-4 pt-12 pb-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/orders" className="p-2 rounded-full" style={{ background: '#1A1E30' }} aria-label="Back">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">{order.order_number}</h1>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Pickup: {format(new Date(order.pickup_date), 'd MMM')}
              {order.pickup_slot ? ` · ${order.pickup_slot.label}` : ''}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto pt-4 space-y-4">

        {/* Status Stepper */}
        <div className="rounded-2xl p-5" style={{ background: '#10131F', border: '1px solid #1E2340' }}>
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: '#64748B' }}>
            Order Status
          </h2>

          {isCancelled ? (
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.2)' }}>
                <span style={{ color: '#EF4444' }}>✕</span>
              </div>
              <div>
                <p className="font-semibold text-white">Order Cancelled</p>
                <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                  {getStatusTime('cancelled') || ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {ALL_STATUSES.map((status, index) => {
                const isDone = index < currentStatusIndex
                const isActive = index === currentStatusIndex
                const statusTime = getStatusTime(status)

                return (
                  <div key={status} className="flex gap-4">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: isDone
                            ? 'rgba(5,150,105,0.2)'
                            : isActive
                            ? 'rgba(99,102,241,0.2)'
                            : '#1A1E30',
                          border: isActive ? '2px solid #6366F1' : 'none',
                        }}
                      >
                        {isDone ? (
                          <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                        ) : isActive ? (
                          <Circle className="w-4 h-4 animate-pulse" style={{ color: '#6366F1' }} />
                        ) : (
                          <Clock className="w-4 h-4" style={{ color: '#374151' }} />
                        )}
                      </div>
                      {index < ALL_STATUSES.length - 1 && (
                        <div
                          className="w-0.5 flex-1 my-1 min-h-4"
                          style={{
                            background: isDone ? '#059669' : '#1E2340',
                            opacity: isDone ? 0.5 : 1,
                          }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-4 flex-1 pt-1">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: isDone || isActive ? '#F1F5F9' : '#374151' }}
                      >
                        {STATUS_LABELS[status]}
                      </p>
                      {isActive && (
                        <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                          {STATUS_DESCRIPTIONS[status]}
                        </p>
                      )}
                      {statusTime && (
                        <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{statusTime}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Rider info (when assigned) */}
        {order.rider && (
          <div className="rounded-2xl p-4" style={{ background: '#10131F', border: '1px solid #1E2340' }}>
            <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#64748B' }}>
              Your Rider
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#6366F1' }}>
                  {order.rider.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{order.rider.name}</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: '#94A3B8' }}>
                    <Star className="w-3 h-3" style={{ color: '#F59E0B' }} />
                    {order.rider.rating.toFixed(1)}
                    {order.rider.vehicle_type && ` · ${order.rider.vehicle_type}`}
                    {order.rider.vehicle_number && ` · ${order.rider.vehicle_number}`}
                  </p>
                </div>
              </div>
              <a
                href={`tel:${order.rider.phone}`}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(5,150,105,0.2)' }}
                aria-label={`Call ${order.rider.name}`}
              >
                <Phone className="w-5 h-5" style={{ color: '#059669' }} />
              </a>
            </div>
          </div>
        )}

        {/* Address */}
        {order.address && (
          <div className="rounded-2xl p-4" style={{ background: '#10131F', border: '1px solid #1E2340' }}>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5" style={{ color: '#6366F1' }} />
              <div>
                <p className="text-sm font-semibold text-white">Pickup Address</p>
                <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ''}
                </p>
                {order.address.landmark && (
                  <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                    Near {order.address.landmark}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        {order.items.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#10131F', border: '1px solid #1E2340' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1E2340' }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>
                Items
              </h2>
            </div>
            {order.items.map((item, index) => (
              <div key={item.id}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: index < order.items.length - 1 ? '1px solid #1E2340' : 'none' }}>
                <div>
                  <p className="text-sm text-white">
                    {item.quantity}× {item.item_name}
                  </p>
                  <p className="text-xs capitalize mt-0.5" style={{ color: '#64748B' }}>
                    {item.service_type.replace('_', ' ')}
                  </p>
                </div>
                <p className="text-sm font-medium text-white">₹{item.total_price}</p>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 font-bold">
              <span className="text-white">Total</span>
              <span style={{ color: '#6366F1' }}>
                {order.order_type === 'subscription' ? 'Subscription' : `₹${order.total}`}
              </span>
            </div>
          </div>
        )}

        {/* Special instructions */}
        {order.special_instructions && (
          <div className="rounded-2xl p-4" style={{ background: '#10131F', border: '1px solid #1E2340' }}>
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 mt-0.5" style={{ color: '#F59E0B' }} />
              <div>
                <p className="text-sm font-semibold text-white">Special Instructions</p>
                <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>{order.special_instructions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Support */}
        <Link href={`/support?orderId=${order.id}`}>
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: '#10131F', border: '1px solid #1E2340' }}>
            <MessageCircle className="w-5 h-5" style={{ color: '#6366F1' }} />
            <p className="text-sm font-medium text-white">Need help with this order?</p>
            <ChevronLeft className="w-5 h-5 ml-auto rotate-180" style={{ color: '#64748B' }} />
          </div>
        </Link>
      </div>
    </div>
  )
}
