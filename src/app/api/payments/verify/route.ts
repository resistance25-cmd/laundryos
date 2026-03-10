// src/app/api/payments/verify/route.ts
// CRITICAL: HMAC signature verified BEFORE any DB writes
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { addCredits } from '@/lib/credits'
import { notifyUser, createNotification } from '@/lib/notifications'
import { addDays } from 'date-fns'
import type { VerifyPaymentRequest } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as VerifyPaymentRequest
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, type, referenceId } = body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 })
    }

    // CRITICAL: Verify signature BEFORE any DB writes
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const userId = session.user.id

    if (type === 'subscription') {
      // Fetch plan details
      const { data: plan } = await adminClient
        .from('subscription_plans')
        .select('*')
        .eq('id', referenceId)
        .single()

      if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

      // Expire any existing active subscriptions
      await adminClient
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('user_id', userId)
        .eq('status', 'active')

      const now = new Date()
      const expiresAt = addDays(now, plan.validity_days)

      // Create new subscription
      const { data: sub, error: subError } = await adminClient
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          wash_credits_remaining: plan.wash_credits,
          press_credits_remaining: plan.press_credits,
          dry_clean_credits_remaining: plan.dry_clean_credits,
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active',
          payment_id: razorpayPaymentId,
          amount_paid: plan.price,
        })
        .select('id')
        .single()

      if (subError || !sub) {
        return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
      }

      // Log credits to ledger
      await addCredits(userId, sub.id, plan, adminClient)

      // Record payment
      await adminClient.from('payments').insert({
        user_id: userId,
        subscription_id: sub.id,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        amount: plan.price,
        currency: 'INR',
        status: 'success',
      })

      // Notify user
      await Promise.all([
        notifyUser(userId, {
          title: '🎉 Subscription Activated!',
          body: `Your ${plan.name} plan is now active.`,
          url: '/subscription',
        }, adminClient),
        createNotification({
          userId,
          title: '🎉 Subscription Activated!',
          body: `Your ${plan.name} plan is now active.`,
          type: 'subscription_activated',
        }, adminClient),
      ])

      return NextResponse.json({ success: true, subscriptionId: sub.id })
    }

    if (type === 'order') {
      // Update order payment status
      await adminClient
        .from('orders')
        .update({ payment_status: 'paid', payment_id: razorpayPaymentId, payment_method: 'razorpay' })
        .eq('id', referenceId)

      // Record payment
      await adminClient.from('payments').insert({
        user_id: userId,
        order_id: referenceId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        amount: 0, // fetched from order
        currency: 'INR',
        status: 'success',
      })

      return NextResponse.json({ success: true, orderId: referenceId })
    }

    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
  } catch (err: unknown) {
    const error = err as { message?: string }
    console.error('[verify-payment]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
