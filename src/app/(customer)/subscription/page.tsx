'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronLeft, Loader2, Shirt, Sparkles, WashingMachine, Wind } from 'lucide-react'
import toast from 'react-hot-toast'
import { differenceInDays } from 'date-fns'
import type { SubscriptionPlan, UserSubscription } from '@/types'
import CustomerBottomNav from '@/components/app/CustomerBottomNav'

function first<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

declare global {
  interface Window { Razorpay: new (options: Record<string, unknown>) => { open: () => void } }
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [activeSub, setActiveSub] = useState<UserSubscription | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userPhone, setUserPhone] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function load(): Promise<void> {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      setUserId(session.user.id)

      const [plansRes, subRes, userRes] = await Promise.all([
        supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('user_subscriptions').select('*, plan:subscription_plans(*)').eq('user_id', session.user.id).eq('status', 'active').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('users').select('name, phone').eq('id', session.user.id).single(),
      ])

      setPlans(plansRes.data || [])
      setActiveSub(subRes.data)
      setUserName(userRes.data?.name || '')
      setUserPhone(userRes.data?.phone || '')
      setLoading(false)
    }
    void load()
  }, [supabase])

  async function handlePurchase(plan: SubscriptionPlan): Promise<void> {
    if (purchasing) return
    setPurchasing(plan.id)

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          currency: 'INR',
          userId,
          type: 'subscription',
          referenceId: plan.id,
        }),
      })

      const data = await res.json() as { razorpayOrderId?: string; amount?: number; key?: string; error?: string }

      if (!res.ok || data.error) {
        toast.error(data.error || 'Failed to initiate payment')
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)

      script.onload = () => {
        const options: Record<string, unknown> = {
          key: data.key,
          amount: data.amount,
          currency: 'INR',
          name: 'LaundryOS',
          description: `${plan.name} Plan - 30 days`,
          order_id: data.razorpayOrderId,
          prefill: { name: userName, contact: userPhone },
          theme: { color: '#2f6fed' },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                type: 'subscription',
                referenceId: plan.id,
              }),
            })

            if (verifyRes.ok) {
              toast.success('Subscription activated')
              window.location.href = '/subscription/success'
            } else {
              toast.error('Payment verification failed. Contact support.')
            }
          },
          modal: { backdropclose: false },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
        setPurchasing(null)
      }
    } catch {
      toast.error('Something went wrong')
      setPurchasing(null)
    }
  }

  if (loading) {
    return <div className="app-screen app-screen--customer flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--app-primary)' }} /></div>
  }

  const expiryDays = activeSub ? differenceInDays(new Date(activeSub.expires_at), new Date()) : 0

  return (
    <div className="app-screen app-screen--customer">
      <header className="app-topbar safe-top">
        <div className="app-topbar__inner app-topbar__inner--phone flex items-center gap-3">
          <Link href="/dashboard" className="app-icon-wrap" aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <span className="app-kicker">Plans</span>
            <h1 className="app-title text-2xl">Subscription studio</h1>
          </div>
        </div>
      </header>

      <main className="app-shell app-shell--phone">
        {activeSub ? (
          <section className="app-panel app-card--accent">
            <div className="flex items-center gap-2" style={{ color: 'var(--app-accent)' }}>
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-bold">Active now: {first(activeSub.plan)?.name} plan</span>
            </div>
            <p className="app-note mt-3">Expires in {expiryDays} day{expiryDays !== 1 ? 's' : ''}</p>
            <div className="app-grid app-grid--3 mt-5">
              {[
                { icon: <WashingMachine className="h-4 w-4" />, label: 'Wash', left: activeSub.wash_credits_remaining, total: first(activeSub.plan)?.wash_credits || 0 },
                { icon: <Shirt className="h-4 w-4" />, label: 'Press', left: activeSub.press_credits_remaining, total: first(activeSub.plan)?.press_credits || 0 },
                { icon: <Wind className="h-4 w-4" />, label: 'Dry clean', left: activeSub.dry_clean_credits_remaining, total: first(activeSub.plan)?.dry_clean_credits || 0 },
              ].map((credit) => (
                <div key={credit.label} className="app-stat">
                  <div className="app-icon-wrap">{credit.icon}</div>
                  <div className="app-stat__value">{credit.left}/{credit.total}</div>
                  <div className="app-stat__label">{credit.label} credits</div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="app-card app-card--warm">
            <h2 className="text-xl font-bold" style={{ color: 'var(--app-text)' }}>Choose a monthly plan</h2>
            <p className="app-note mt-2">The new customer portal is built around faster repeat laundry, and plans unlock the smoothest flow.</p>
          </section>
        )}

        <div className="app-list mt-5">
          {plans.map((plan, index) => {
            const isPopular = index === 1
            const isCurrentPlan = activeSub?.plan_id === plan.id
            return (
              <div key={plan.id} className={`app-card ${isPopular ? 'app-card--accent' : ''}`}>
                <div className="app-card__row" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <p className="app-kicker">{isPopular ? 'Popular choice' : 'Plan option'}</p>
                    <h3 className="mt-2 text-2xl font-bold" style={{ color: 'var(--app-text)' }}>{plan.name}</h3>
                    <p className="mt-2 text-3xl font-black" style={{ color: 'var(--app-primary)' }}>Rs {plan.price}<span className="ml-1 text-sm font-medium" style={{ color: 'var(--app-text-muted)' }}>/month</span></p>
                  </div>
                  {isCurrentPlan ? <span className="status-pill" style={{ background: 'rgba(22,163,74,0.14)', color: '#15803D' }}>Current plan</span> : null}
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    { icon: <WashingMachine className="h-4 w-4" />, text: `${plan.wash_credits} Wash & Fold` },
                    { icon: <Shirt className="h-4 w-4" />, text: `${plan.press_credits} Steam Press` },
                    ...(plan.dry_clean_credits > 0 ? [{ icon: <Wind className="h-4 w-4" />, text: `${plan.dry_clean_credits} Dry Clean` }] : []),
                    ...(plan.free_pickup ? [{ icon: <Check className="h-4 w-4" />, text: 'Free pickup and delivery' }] : []),
                    { icon: <Check className="h-4 w-4" />, text: '30 day validity' },
                  ].map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3 text-sm" style={{ color: 'var(--app-text-muted)' }}>
                      <span style={{ color: 'var(--app-success)' }}>{feature.icon}</span>
                      {feature.text}
                    </div>
                  ))}
                </div>

                <button onClick={() => void handlePurchase(plan)} disabled={!!purchasing} className="btn-primary mt-5 w-full">
                  {purchasing === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrentPlan ? 'Renew plan' : `Choose ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>
      </main>

      <CustomerBottomNav active="profile" />
    </div>
  )
}
