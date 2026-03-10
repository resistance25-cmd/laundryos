// src/app/api/payments/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createRazorpayOrder } from '@/lib/razorpay'
import type { CreatePaymentOrderRequest } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as CreatePaymentOrderRequest
    const { amount, currency, userId, type, referenceId } = body

    if (!amount || !userId || !type || !referenceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (amount < 1 || amount > 100000) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const rzpOrder = await createRazorpayOrder(
      amount,
      currency || 'INR',
      `${type}-${referenceId}`,
      { type, referenceId, userId }
    )

    return NextResponse.json({
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (err: unknown) {
    const error = err as { message?: string }
    console.error('[create-payment-order]', error)
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
