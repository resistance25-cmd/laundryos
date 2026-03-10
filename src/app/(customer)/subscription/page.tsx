// src/app/(customer)/subscription/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Check, Sparkles, WashingMachine, Shirt, Wind, Loader2, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { differenceInDays } from 'date-fns'
import type { SubscriptionPlan, UserSubscription } from '@/types'

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
  }, [])

  async function handlePurchase(plan: SubscriptionPlan): Promise<void> {
    if (purchasing) return
    setPurchasing(plan.id)

    try {
      // Create Razorpay order
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

      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)

      script.onload = () => {
        const options: Record<string, unknown> = {
          key: data.key,
          amount: data.amount,
          currency: 'INR',
          name: 'LaundryOS',
          description: `${plan.name} Plan — 30 days`,
          order_id: data.razorpayOrderId,
          prefill: { name: userName, contact: userPhone },
          theme: { color: '#6366F1' },
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
              toast.success('Subscription activated!')
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
    return (
      <div className="customer-dark min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6366F1' }} />
      </div>
    )
  }

  const expiryDays = activeSub ? differenceInDays(new Date(activeSub.expires_at), new Date()) : 0

  return (
    <div className="customer-dark min-h-screen pb-10">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-dark px-4 pt-12 pb-4 safe-top">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-full" style={{ background: '#1A1E30' }} aria-label="Back">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-xl font-bold text-white">Subscription Plans</h1>
        </div>
      </header>

      <div className="px-4 max-w-lg mx-auto pt-4 space-y-5">
        {/* Active plan info */}
        {activeSub && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: '#34D399' }} />
              <p className="text-sm font-semibold" style={{ color: '#34D399' }}>
                Active: {first(activeSub.plan)?.name} Plan
              </p>
            </div>
            {/* Credits bar */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { icon: <WashingMachine className="w-4 h-4" />, label: 'Wash', used: (first(activeSub.plan)?.wash_credits || 0) - activeSub.wash_credits_remaining, total: first(activeSub.plan)?.wash_credits || 0 },
                { icon: <Shirt className="w-4 h-4" />, label: 'Press', used: (first(activeSub.plan)?.press_credits || 0) - activeSub.press_credits_remaining, total: first(activeSub.plan)?.press_credits || 0 },
                { icon: <Wind className="w-4 h-4" />, label: 'Dry Clean', used: (first(activeSub.plan)?.dry_clean_credits || 0) - activeSub.dry_clean_credits_remaining, total: first(activeSub.plan)?.dry_clean_credits || 0 },
              ].map((credit) => (
                <div key={credit.label}>
                  <div className="flex items-center gap-1 mb-1" style={{ color: '#94A3B8' }}>
                    {credit.icon}
                    <span className="text-xs">{credit.label}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: '#1E2340' }}>
                    <div className="h-1.5 rounded-full" style={{
                      width: `${credit.total > 0 ? ((credit.total - credit.used) / credit.total) * 100 : 0}%`,
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                    }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                    {credit.total - credit.used}/{credit.total}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Expires in {expiryDays} day{expiryDays !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        <p className="text-sm text-center" style={{ color: '#94A3B8' }}>
          {activeSub ? 'Upgrade or renew your plan' : 'Choose a plan to get started'}
        </p>

        {/* Plan cards */}
        {plans.map((plan, index) => {
          const isPopular = index === 1
          const isCurrentPlan = activeSub?.plan_id === plan.id
          return (
            <div
              key={plan.id}
              className="rounded-2xl overflow-hidden"
              style={{
                border: isPopular ? '2px solid #6366F1' : '1px solid #1E2340',
                background: '#10131F',
              }}
            >
              {isPopular && (
                <div className="text-center py-1.5 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                  ⭐ MOST POPULAR
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-3xl font-black mt-1" style={{ color: '#6366F1' }}>
                      ₹{plan.price}
                      <span className="text-sm font-normal" style={{ color: '#64748B' }}>/month</span>
                    </p>
                  </div>
                  {isCurrentPlan && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ background: 'rgba(5,150,105,0.2)', color: '#34D399' }}>
                      Current Plan
                    </span>
                  )}
                </div>

                {/* Credits */}
                <div className="space-y-2 mb-5">
                  {[
                    { icon: <WashingMachine className="w-4 h-4" />, text: `${plan.wash_credits} Wash & Fold` },
                    { icon: <Shirt className="w-4 h-4" />, text: `${plan.press_credits} Steam Press` },
                    ...(plan.dry_clean_credits > 0 ? [{ icon: <Wind className="w-4 h-4" />, text: `${plan.dry_clean_credits} Dry Clean` }] : []),
                    ...(plan.free_pickup ? [{ icon: <Check className="w-4 h-4" />, text: 'Free Pickup & Delivery' }] : []),
                    { icon: <Check className="w-4 h-4" />, text: '30 day validity' },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span style={{ color: '#059669' }}>{feature.icon}</span>
                      <span className="text-sm" style={{ color: '#CBD5E1' }}>{feature.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => void handlePurchase(plan)}
                  disabled={!!purchasing}
                  className={`w-full py-3 rounded-full font-bold text-sm transition-all ${
                    isPopular ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  {purchasing === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : isCurrentPlan ? (
                    'Renew Plan'
                  ) : (
                    `Get ${plan.name}`
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
