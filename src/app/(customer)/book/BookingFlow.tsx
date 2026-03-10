// src/app/(customer)/book/BookingFlow.tsx
'use client'

import { useState, useCallback } from 'react'
import { addDays, format } from 'date-fns'
import { ChevronLeft, ChevronRight, Check, Loader2, WashingMachine, Shirt, Wind, Plus, Minus, MapPin, Clock, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Address, PickupSlot, UserSubscription, PricingItem, Zone, OrderType, ServiceType, CreateOrderItem } from '@/types'

interface BookingUser { id: string; name: string; zone_id: string | null }

interface Props {
  user: BookingUser
  addresses: Address[]
  pickupSlots: PickupSlot[]
  subscription: UserSubscription | null
  pricing: PricingItem[]
  zones: Zone[]
}

interface BookItem extends CreateOrderItem { id: string }

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

const CUTOFF_HOUR = 14
const STEPS = ['Type', 'Items', 'Address', 'Slot', 'Review', 'Payment', 'Done']
const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  wash_fold:   <WashingMachine className="w-5 h-5" />,
  steam_press: <Shirt className="w-5 h-5" />,
  dry_clean:   <Wind className="w-5 h-5" />,
}
const SERVICE_LABELS: Record<ServiceType, string> = {
  wash_fold: 'Wash & Fold',
  steam_press: 'Steam Press',
  dry_clean: 'Dry Clean',
}

function getPickupDate(): Date {
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setHours(CUTOFF_HOUR, 0, 0, 0)
  return now > cutoff ? addDays(now, 1) : now
}

export default function BookingFlow({ user, addresses, pickupSlots, subscription, pricing, zones }: Props) {
  const [step, setStep] = useState<number>(1)
  const [orderType, setOrderType] = useState<OrderType | null>(null)
  const [items, setItems] = useState<BookItem[]>([])
  const [addressId, setAddressId] = useState<string>(addresses.find((a) => a.is_default)?.id || addresses[0]?.id || '')
  const [pickupDate] = useState<Date>(getPickupDate())
  const [pickupSlotId, setPickupSlotId] = useState<string>('')
  const [specialInstructions, setSpecialInstructions] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [orderId, setOrderId] = useState<string>('')
  const [orderNumber, setOrderNumber] = useState<string>('')

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const selectedAddress = addresses.find((a) => a.id === addressId)
  const selectedSlot = pickupSlots.find((s) => s.id === pickupSlotId)

  const groupedPricing = pricing.reduce<Record<ServiceType, PricingItem[]>>((acc, p) => {
    const key = p.service_type as ServiceType
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {} as Record<ServiceType, PricingItem[]>)

  const changeQty = useCallback((itemId: string, delta: number) => {
    setItems((prev) => prev.map((i) => {
      if (i.id !== itemId) return i
      const newQty = Math.max(0, i.quantity + delta)
      return { ...i, quantity: newQty }
    }).filter((i) => i.quantity > 0))
  }, [])

  function addItem(serviceType: ServiceType, itemName: string, unitPrice: number) {
    const existing = items.find((i) => i.serviceType === serviceType && i.itemName === itemName)
    if (existing) {
      changeQty(existing.id, 1)
    } else {
      setItems((prev) => [...prev, {
        id: `${serviceType}-${itemName}`,
        serviceType,
        itemName,
        quantity: 1,
        unitPrice,
      }])
    }
  }

  async function handleSubmit() {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          addressId,
          zoneId: selectedAddress?.zone_id || user.zone_id,
          pickupDate: format(pickupDate, 'yyyy-MM-dd'),
          pickupSlotId,
          items: items.map(({ serviceType, itemName, quantity, unitPrice }) => ({
            serviceType, itemName, quantity, unitPrice,
          })),
          orderType,
          subscriptionId: orderType === 'subscription' ? subscription?.id : undefined,
          specialInstructions,
        }),
      })

      const data = await res.json() as { orderId?: string; orderNumber?: string; error?: string }

      if (!res.ok || data.error) {
        toast.error(data.error || 'Failed to place order')
        return
      }

      setOrderId(data.orderId || '')
      setOrderNumber(data.orderNumber || '')

      // If single order with payment, open Razorpay
      if (orderType === 'single' && data.orderId) {
        await openRazorpay(data)
        return
      }

      setStep(7)
    } catch {
      toast.error('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function openRazorpay(orderData: { orderId?: string; razorpayOrder?: { id: string; amount: number } }) {
    if (!orderData.razorpayOrder) {
      setStep(7)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(script)

    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.razorpayOrder!.amount,
        currency: 'INR',
        name: 'LaundryOS',
        description: 'Laundry Pickup',
        order_id: orderData.razorpayOrder!.id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              type: 'order',
              referenceId: orderData.orderId,
            }),
          })
          if (verifyRes.ok) {
            setStep(7)
          } else {
            toast.error('Payment verification failed. Contact support.')
          }
        },
        theme: { color: '#6366F1' },
        modal: { backdropclose: false },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
      setLoading(false)
    }
  }

  const canProceed = (() => {
    if (step === 1) return !!orderType
    if (step === 2) return items.length > 0
    if (step === 3) return !!addressId
    if (step === 4) return !!pickupSlotId
    return true
  })()

  return (
    <div className="customer-dark min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-dark px-4 pt-12 pb-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 1 && step < 7 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="p-2 rounded-full"
              style={{ background: '#1A1E30' }}
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">
              {step < 7 ? STEPS[step - 1] : 'Confirmed!'}
            </h1>
            {step < 7 && (
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                Step {step} of 6
              </p>
            )}
          </div>
        </div>
        {/* Progress bar */}
        {step < 7 && (
          <div className="max-w-lg mx-auto mt-3">
            <div className="h-1 rounded-full" style={{ background: '#1E2340' }}>
              <div
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: `${((step - 1) / 6) * 100}%`,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                }}
              />
            </div>
          </div>
        )}
      </header>

      <div className="px-4 pb-32 max-w-lg mx-auto pt-4">

        {/* STEP 1: Choose type */}
        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              How would you like to pay?
            </p>
            <button
              onClick={() => setOrderType('subscription')}
              disabled={!subscription}
              className="w-full rounded-2xl p-5 text-left transition-all"
              style={{
                background: orderType === 'subscription' ? 'rgba(99,102,241,0.2)' : '#10131F',
                border: `2px solid ${orderType === 'subscription' ? '#6366F1' : '#1E2340'}`,
                opacity: subscription ? 1 : 0.5,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <WashingMachine className="w-5 h-5" style={{ color: '#6366F1' }} />
                </div>
                <div>
                  <p className="font-semibold text-white">Use Subscription</p>
                  <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                    {subscription
                      ? `${subscription.wash_credits_remaining}W · ${subscription.press_credits_remaining}P · ${subscription.dry_clean_credits_remaining}DC credits remaining`
                      : 'No active plan — subscribe first'}
                  </p>
                </div>
                {orderType === 'subscription' && (
                  <Check className="w-5 h-5 ml-auto" style={{ color: '#6366F1' }} />
                )}
              </div>
            </button>

            <button
              onClick={() => setOrderType('single')}
              className="w-full rounded-2xl p-5 text-left transition-all"
              style={{
                background: orderType === 'single' ? 'rgba(99,102,241,0.2)' : '#10131F',
                border: `2px solid ${orderType === 'single' ? '#6366F1' : '#1E2340'}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <CreditCard className="w-5 h-5" style={{ color: '#6366F1' }} />
                </div>
                <div>
                  <p className="font-semibold text-white">Pay Per Item</p>
                  <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                    Pay via Razorpay (UPI, card, net banking)
                  </p>
                </div>
                {orderType === 'single' && (
                  <Check className="w-5 h-5 ml-auto" style={{ color: '#6366F1' }} />
                )}
              </div>
            </button>
          </div>
        )}

        {/* STEP 2: Items */}
        {step === 2 && (
          <div className="space-y-6 animate-slide-up">
            {(Object.keys(SERVICE_LABELS) as ServiceType[]).map((serviceType) => {
              const serviceItems = groupedPricing[serviceType] || []
              if (serviceItems.length === 0) return null
              return (
                <div key={serviceType}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ color: '#6366F1' }}>{SERVICE_ICONS[serviceType]}</span>
                    <h3 className="font-semibold text-white">{SERVICE_LABELS[serviceType]}</h3>
                  </div>
                  <div className="space-y-2">
                    {serviceItems.map((item) => {
                      const cartItem = items.find((i) => i.serviceType === serviceType && i.itemName === item.item_name)
                      return (
                        <div key={item.id}
                          className="flex items-center justify-between rounded-xl p-3"
                          style={{ background: '#10131F', border: '1px solid #1E2340' }}>
                          <div>
                            <p className="text-sm font-medium text-white">{item.item_name}</p>
                            <p className="text-xs" style={{ color: '#64748B' }}>₹{item.unit_price}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {cartItem && cartItem.quantity > 0 ? (
                              <>
                                <button
                                  onClick={() => changeQty(cartItem.id, -1)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                  style={{ background: '#1A1E30' }}
                                  aria-label={`Decrease ${item.item_name}`}
                                >
                                  <Minus className="w-4 h-4" style={{ color: '#6366F1' }} />
                                </button>
                                <span className="text-sm font-bold text-white w-4 text-center">
                                  {cartItem.quantity}
                                </span>
                              </>
                            ) : null}
                            <button
                              onClick={() => addItem(serviceType, item.item_name, item.unit_price)}
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                              aria-label={`Add ${item.item_name}`}
                            >
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Cart summary */}
            {items.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <p className="text-sm font-semibold" style={{ color: '#818CF8' }}>
                  {items.reduce((s, i) => s + i.quantity, 0)} items · ₹{subtotal}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Address */}
        {step === 3 && (
          <div className="space-y-3 animate-slide-up">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => setAddressId(addr.id)}
                className="w-full rounded-2xl p-4 text-left transition-all"
                style={{
                  background: addressId === addr.id ? 'rgba(99,102,241,0.15)' : '#10131F',
                  border: `2px solid ${addressId === addr.id ? '#6366F1' : '#1E2340'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#6366F1' }} />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{addr.label || 'Address'}</p>
                    <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                    </p>
                    {addr.landmark && (
                      <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                        Near {addr.landmark}
                      </p>
                    )}
                  </div>
                  {addressId === addr.id && (
                    <Check className="w-5 h-5" style={{ color: '#6366F1' }} />
                  )}
                </div>
              </button>
            ))}
            <button
              onClick={() => { window.location.href = '/addresses?return=/book' }}
              className="w-full rounded-2xl p-4 flex items-center gap-3"
              style={{ background: '#10131F', border: '2px dashed #1E2340' }}
            >
              <Plus className="w-5 h-5" style={{ color: '#64748B' }} />
              <span className="text-sm font-medium" style={{ color: '#64748B' }}>
                Add new address
              </span>
            </button>
          </div>
        )}

        {/* STEP 4: Slot */}
        {step === 4 && (
          <div className="space-y-3 animate-slide-up">
            <div className="rounded-xl p-3 mb-2" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <p className="text-sm font-medium" style={{ color: '#818CF8' }}>
                Pickup date: {format(pickupDate, 'EEEE, d MMMM')}
              </p>
            </div>
            {pickupSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setPickupSlotId(slot.id)}
                className="w-full rounded-2xl p-4 text-left transition-all"
                style={{
                  background: pickupSlotId === slot.id ? 'rgba(99,102,241,0.15)' : '#10131F',
                  border: `2px solid ${pickupSlotId === slot.id ? '#6366F1' : '#1E2340'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" style={{ color: '#6366F1' }} />
                  <span className="font-semibold text-white">{slot.label}</span>
                  {pickupSlotId === slot.id && (
                    <Check className="w-5 h-5 ml-auto" style={{ color: '#6366F1' }} />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 5: Review */}
        {step === 5 && (
          <div className="space-y-4 animate-slide-up">
            <ReviewRow label="Order Type" value={orderType === 'subscription' ? 'Subscription' : 'Pay Per Item'} />
            <ReviewRow label="Address" value={selectedAddress ? `${selectedAddress.line1}${selectedAddress.line2 ? ', ' + selectedAddress.line2 : ''}` : '—'} />
            <ReviewRow label="Pickup" value={`${format(pickupDate, 'd MMM')} · ${selectedSlot?.label || '—'}`} />
            <ReviewRow label="Delivery" value={`${format(addDays(pickupDate, 1), 'd MMM')} (next day)`} />

            {/* Items */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#10131F', border: '1px solid #1E2340' }}>
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1E2340' }}>
                  <span className="text-sm text-white">{item.quantity}× {item.itemName}</span>
                  <span className="text-sm font-medium text-white">₹{item.quantity * item.unitPrice}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-semibold text-white">Total</span>
                <span className="font-bold text-lg" style={{ color: '#6366F1' }}>
                  {orderType === 'subscription' ? 'Free (credits)' : `₹${subtotal}`}
                </span>
              </div>
            </div>

            {/* Special instructions */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#CBD5E1' }}>
                Special instructions (optional)
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Handle with care, no bleach..."
                rows={3}
                className="input-dark resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 6: Payment */}
        {step === 6 && (
          <div className="space-y-4 animate-slide-up">
            <div className="rounded-2xl p-5" style={{ background: '#10131F', border: '1px solid #1E2340' }}>
              <h3 className="font-semibold text-white mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#94A3B8' }}>Subtotal</span>
                  <span className="text-white">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#94A3B8' }}>Delivery</span>
                  <span className="text-white">₹0</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold" style={{ borderColor: '#1E2340' }}>
                  <span className="text-white">Total</span>
                  <span style={{ color: '#6366F1' }}>
                    {orderType === 'subscription' ? '₹0 (credits)' : `₹${subtotal}`}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary w-full py-4 text-base"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : orderType === 'subscription' ? (
                'Confirm Order'
              ) : (
                `Pay ₹${subtotal}`
              )}
            </button>
          </div>
        )}

        {/* STEP 7: Confirmation */}
        {step === 7 && (
          <div className="text-center py-12 animate-slide-up">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(5,150,105,0.2)' }}>
              <Check className="w-10 h-10" style={{ color: '#059669' }} />
            </div>
            <h2 className="text-2xl font-bold text-white">Order Placed!</h2>
            <p className="text-sm mt-2 mb-1" style={{ color: '#94A3B8' }}>Order number</p>
            <p className="text-xl font-mono font-bold" style={{ color: '#6366F1' }}>{orderNumber}</p>
            <p className="text-sm mt-4" style={{ color: '#94A3B8' }}>
              We&apos;ll notify you when your rider is on the way.
            </p>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { window.location.href = `/orders/${orderId}` }}
                className="btn-primary flex-1"
              >
                Track Order
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard' }}
                className="btn-ghost flex-1"
              >
                Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {step < 6 && step < 7 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 glass-dark safe-bottom">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="btn-primary w-full py-4 text-base"
            >
              Continue <ChevronRight className="w-5 h-5 inline ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3" style={{ borderBottom: '1px solid #1E2340' }}>
      <span className="text-sm" style={{ color: '#64748B' }}>{label}</span>
      <span className="text-sm font-medium text-white text-right max-w-48">{value}</span>
    </div>
  )
}

