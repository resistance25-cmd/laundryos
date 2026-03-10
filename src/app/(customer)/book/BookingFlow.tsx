'use client'

import { useState, useCallback } from 'react'
import { addDays, format } from 'date-fns'
import { Check, ChevronLeft, ChevronRight, Clock, CreditCard, Loader2, MapPin, Minus, Plus, Shirt, WashingMachine, Wind } from 'lucide-react'
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
  wash_fold: <WashingMachine className="h-5 w-5" />,
  steam_press: <Shirt className="h-5 w-5" />,
  dry_clean: <Wind className="h-5 w-5" />,
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

export default function BookingFlow({ user, addresses, pickupSlots, subscription, pricing }: Props) {
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

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const selectedAddress = addresses.find((address) => address.id === addressId)
  const selectedSlot = pickupSlots.find((slot) => slot.id === pickupSlotId)

  const groupedPricing = pricing.reduce<Record<ServiceType, PricingItem[]>>((acc, item) => {
    const key = item.service_type as ServiceType
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<ServiceType, PricingItem[]>)

  const changeQty = useCallback((itemId: string, delta: number) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item
      const newQty = Math.max(0, item.quantity + delta)
      return { ...item, quantity: newQty }
    }).filter((item) => item.quantity > 0))
  }, [])

  function addItem(serviceType: ServiceType, itemName: string, unitPrice: number) {
    const existing = items.find((item) => item.serviceType === serviceType && item.itemName === itemName)
    if (existing) {
      changeQty(existing.id, 1)
      return
    }

    setItems((prev) => [...prev, {
      id: `${serviceType}-${itemName}`,
      serviceType,
      itemName,
      quantity: 1,
      unitPrice,
    }])
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
          items: items.map(({ serviceType, itemName, quantity, unitPrice }) => ({ serviceType, itemName, quantity, unitPrice })),
          orderType,
          subscriptionId: orderType === 'subscription' ? subscription?.id : undefined,
          specialInstructions,
        }),
      })

      const data = await res.json() as { orderId?: string; orderNumber?: string; error?: string; razorpayOrder?: { id: string; amount: number } }

      if (!res.ok || data.error) {
        toast.error(data.error || 'Failed to place order')
        return
      }

      setOrderId(data.orderId || '')
      setOrderNumber(data.orderNumber || '')

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
        theme: { color: '#2f6fed' },
        modal: { backdropclose: false },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
      setLoading(false)
    }
  }

  const canProceed = step === 1 ? !!orderType : step === 2 ? items.length > 0 : step === 3 ? !!addressId : step === 4 ? !!pickupSlotId : true

  return (
    <div className="app-screen app-screen--customer">
      <header className="app-topbar safe-top">
        <div className="app-topbar__inner app-topbar__inner--phone flex items-center gap-3">
          {step > 1 && step < 7 ? (
            <button onClick={() => setStep((current) => current - 1)} className="app-icon-wrap" aria-label="Go back">
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div className="flex-1">
            <span className="app-kicker">Booking flow</span>
            <h1 className="app-title text-2xl">{step < 7 ? STEPS[step - 1] : 'Confirmed'}</h1>
            {step < 7 ? <p className="app-subtitle">Step {step} of 6 • quick, thumb-friendly booking built like an app flow.</p> : null}
          </div>
        </div>
        {step < 7 ? (
          <div className="app-topbar__inner app-topbar__inner--phone pt-0">
            <div className="h-2 rounded-full" style={{ background: 'var(--app-border)' }}>
              <div className="h-2 rounded-full" style={{ width: `${((step - 1) / 6) * 100}%`, background: 'linear-gradient(135deg, var(--app-primary), var(--app-warm))' }} />
            </div>
          </div>
        ) : null}
      </header>

      <main className="app-shell app-shell--phone pb-32">
        {step === 1 ? (
          <div className="app-list">
            <button onClick={() => setOrderType('subscription')} disabled={!subscription} className="app-card block w-full text-left" style={{ opacity: subscription ? 1 : 0.58, border: `2px solid ${orderType === 'subscription' ? 'var(--app-primary)' : 'var(--app-border)'}` }}>
              <div className="app-card__row">
                <div className="flex items-center gap-3">
                  <div className="app-icon-wrap"><WashingMachine className="h-5 w-5" /></div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--app-text)' }}>Use subscription</div>
                    <div className="app-meta mt-1 text-sm">{subscription ? `${subscription.wash_credits_remaining}W • ${subscription.press_credits_remaining}P • ${subscription.dry_clean_credits_remaining}DC left` : 'No active plan yet'}</div>
                  </div>
                </div>
                {orderType === 'subscription' ? <Check className="h-5 w-5" style={{ color: 'var(--app-primary)' }} /> : null}
              </div>
            </button>
            <button onClick={() => setOrderType('single')} className="app-card block w-full text-left" style={{ border: `2px solid ${orderType === 'single' ? 'var(--app-primary)' : 'var(--app-border)'}` }}>
              <div className="app-card__row">
                <div className="flex items-center gap-3">
                  <div className="app-icon-wrap"><CreditCard className="h-5 w-5" /></div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--app-text)' }}>Pay per item</div>
                    <div className="app-meta mt-1 text-sm">UPI, cards, and net banking through Razorpay.</div>
                  </div>
                </div>
                {orderType === 'single' ? <Check className="h-5 w-5" style={{ color: 'var(--app-primary)' }} /> : null}
              </div>
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            {(Object.keys(SERVICE_LABELS) as ServiceType[]).map((serviceType) => {
              const serviceItems = groupedPricing[serviceType] || []
              if (serviceItems.length === 0) return null
              return (
                <section key={serviceType} className="app-section">
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--app-primary)' }}>{SERVICE_ICONS[serviceType]}</span>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--app-text)' }}>{SERVICE_LABELS[serviceType]}</h2>
                  </div>
                  <div className="app-list">
                    {serviceItems.map((item) => {
                      const cartItem = items.find((entry) => entry.serviceType === serviceType && entry.itemName === item.item_name)
                      return (
                        <div key={item.id} className="app-card">
                          <div className="app-card__row">
                            <div>
                              <div className="font-semibold" style={{ color: 'var(--app-text)' }}>{item.item_name}</div>
                              <div className="app-meta mt-1 text-sm">Rs {item.unit_price}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              {cartItem?.quantity ? (
                                <>
                                  <button onClick={() => changeQty(cartItem.id, -1)} className="app-icon-wrap" aria-label={`Decrease ${item.item_name}`}><Minus className="h-4 w-4" /></button>
                                  <span className="w-4 text-center font-bold" style={{ color: 'var(--app-text)' }}>{cartItem.quantity}</span>
                                </>
                              ) : null}
                              <button onClick={() => addItem(serviceType, item.item_name, item.unit_price)} className="app-icon-wrap" style={{ background: 'linear-gradient(135deg, var(--app-primary), var(--app-warm))', color: 'white' }} aria-label={`Add ${item.item_name}`}>
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
            {items.length > 0 ? <div className="app-card app-card--accent"><div className="font-bold" style={{ color: 'var(--app-primary)' }}>{items.reduce((sum, item) => sum + item.quantity, 0)} items • Rs {subtotal}</div></div> : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="app-list">
            {addresses.map((address) => (
              <button key={address.id} onClick={() => setAddressId(address.id)} className="app-card block w-full text-left" style={{ border: `2px solid ${addressId === address.id ? 'var(--app-primary)' : 'var(--app-border)'}` }}>
                <div className="app-card__row" style={{ alignItems: 'flex-start' }}>
                  <div className="flex items-start gap-3">
                    <div className="app-icon-wrap"><MapPin className="h-5 w-5" /></div>
                    <div>
                      <div className="font-bold" style={{ color: 'var(--app-text)' }}>{address.label || 'Address'}</div>
                      <div className="app-note mt-2">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</div>
                      {address.landmark ? <div className="app-meta mt-1 text-sm">Near {address.landmark}</div> : null}
                    </div>
                  </div>
                  {addressId === address.id ? <Check className="h-5 w-5" style={{ color: 'var(--app-primary)' }} /> : null}
                </div>
              </button>
            ))}
            <button onClick={() => { window.location.href = '/addresses?return=/book' }} className="app-card block w-full text-left" style={{ border: '2px dashed var(--app-border-strong)' }}>
              <div className="flex items-center gap-3"><Plus className="h-5 w-5" style={{ color: 'var(--app-text-muted)' }} /><span className="font-semibold" style={{ color: 'var(--app-text-muted)' }}>Add a new address</span></div>
            </button>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="app-list">
            <div className="app-card app-card--accent"><div className="font-semibold" style={{ color: 'var(--app-primary)' }}>Pickup date: {format(pickupDate, 'EEEE, d MMMM')}</div></div>
            {pickupSlots.map((slot) => (
              <button key={slot.id} onClick={() => setPickupSlotId(slot.id)} className="app-card block w-full text-left" style={{ border: `2px solid ${pickupSlotId === slot.id ? 'var(--app-primary)' : 'var(--app-border)'}` }}>
                <div className="app-card__row">
                  <div className="flex items-center gap-3"><Clock className="h-5 w-5" style={{ color: 'var(--app-primary)' }} /><span className="font-bold" style={{ color: 'var(--app-text)' }}>{slot.label}</span></div>
                  {pickupSlotId === slot.id ? <Check className="h-5 w-5" style={{ color: 'var(--app-primary)' }} /> : null}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <div className="app-panel">
              <ReviewRow label="Order type" value={orderType === 'subscription' ? 'Subscription' : 'Pay per item'} />
              <ReviewRow label="Address" value={selectedAddress ? `${selectedAddress.line1}${selectedAddress.line2 ? ', ' + selectedAddress.line2 : ''}` : '—'} />
              <ReviewRow label="Pickup" value={`${format(pickupDate, 'd MMM')} • ${selectedSlot?.label || '—'}`} />
              <ReviewRow label="Delivery" value={`${format(addDays(pickupDate, 1), 'd MMM')} (next day)`} noBorder />
            </div>
            <div className="app-panel">
              {items.map((item) => <ReviewRow key={item.id} label={`${item.quantity}x ${item.itemName}`} value={`Rs ${item.quantity * item.unitPrice}`} />)}
              <ReviewRow label="Total" value={orderType === 'subscription' ? 'Free (credits)' : `Rs ${subtotal}`} noBorder strong />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold" style={{ color: 'var(--app-text)' }}>Special instructions</label>
              <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="Handle with care, no bleach, separate whites..." rows={3} className="input-dark resize-none" />
            </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-4">
            <div className="app-panel">
              <h3 className="text-lg font-bold" style={{ color: 'var(--app-text)' }}>Order summary</h3>
              <div className="mt-4 space-y-3">
                <ReviewRow label="Subtotal" value={`Rs ${subtotal}`} />
                <ReviewRow label="Delivery" value="Rs 0" />
                <ReviewRow label="Total" value={orderType === 'subscription' ? 'Rs 0 (credits)' : `Rs ${subtotal}`} noBorder strong />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-4 text-base">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : orderType === 'subscription' ? 'Confirm order' : `Pay Rs ${subtotal}`}
            </button>
          </div>
        ) : null}

        {step === 7 ? (
          <div className="app-card app-empty">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'rgba(22,163,74,0.14)' }}>
              <Check className="h-10 w-10" style={{ color: 'var(--app-success)' }} />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--app-text)' }}>Order placed</h2>
            <p className="app-note mt-2">Order number</p>
            <p className="mt-1 text-xl font-mono font-bold" style={{ color: 'var(--app-primary)' }}>{orderNumber}</p>
            <div className="mt-8 flex gap-3">
              <button onClick={() => { window.location.href = `/orders/${orderId}` }} className="btn-primary flex-1">Track order</button>
              <button onClick={() => { window.location.href = '/dashboard' }} className="btn-ghost flex-1">Dashboard</button>
            </div>
          </div>
        ) : null}
      </main>

      {step < 6 && step < 7 ? (
        <div className="mobile-nav" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <div className="mobile-nav__inner" style={{ gridTemplateColumns: '1fr', width: 'min(100%, 480px)' }}>
            <button onClick={() => setStep((current) => current + 1)} disabled={!canProceed} className="btn-primary w-full py-4 text-base">
              Continue <ChevronRight className="ml-1 inline h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ReviewRow({ label, value, noBorder = false, strong = false }: { label: string; value: string; noBorder?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3" style={{ borderBottom: noBorder ? 'none' : '1px solid var(--app-border)' }}>
      <span className="text-sm" style={{ color: 'var(--app-text-muted)' }}>{label}</span>
      <span className="max-w-48 text-right text-sm" style={{ color: 'var(--app-text)', fontWeight: strong ? 800 : 600 }}>{value}</span>
    </div>
  )
}
