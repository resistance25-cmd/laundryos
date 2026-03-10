// src/lib/razorpay.ts
// Server-side Razorpay helpers only — never import this in browser code
import crypto from 'crypto'
import type { RazorpayOrder } from '@/types'

/**
 * Create a Razorpay order (server-side only)
 * Amount must be in paise (₹1 = 100 paise)
 */
export async function createRazorpayOrder(
  amountInRupees: number,
  currency: string = 'INR',
  receiptId: string,
  notes?: Record<string, string>
): Promise<RazorpayOrder> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }

  const amountInPaise = Math.round(amountInRupees * 100)

  const body = {
    amount: amountInPaise,
    currency,
    receipt: receiptId.substring(0, 40), // Razorpay receipt max 40 chars
    notes: notes || {},
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Razorpay order creation failed: ${errorText}`)
  }

  const order = await response.json() as { id: string; amount: number; currency: string; receipt: string }
  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
  }
}

/**
 * Verify Razorpay payment signature (HMAC SHA256)
 * MUST be called before any DB writes after payment
 * 
 * @param orderId     - Razorpay order ID
 * @param paymentId   - Razorpay payment ID
 * @param signature   - Signature from client callback
 * @returns true if signature is valid
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET not configured')
  }

  const body = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex')

  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    )
  } catch {
    // Buffers differ in length — invalid signature
    return false
  }
}

/**
 * Fetch a Razorpay payment's details (for server-side verification)
 */
export async function fetchRazorpayPayment(
  paymentId: string
): Promise<{ id: string; status: string; amount: number; method: string } | null> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) return null

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  try {
    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Basic ${credentials}` },
      }
    )

    if (!response.ok) return null

    const data = await response.json() as { id: string; status: string; amount: number; method: string }
    return data
  } catch {
    return null
  }
}

/**
 * Generate Razorpay checkout options for client-side use
 * Call this from an API route that returns the config to the browser
 */
export function getRazorpayCheckoutOptions(params: {
  orderId: string
  amount: number        // in paise
  currency: string
  description: string
  userName?: string
  userEmail?: string
  userPhone?: string
}): Record<string, unknown> {
  return {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: params.amount,
    currency: params.currency,
    name: 'LaundryOS',
    description: params.description,
    image: '/icons/icon-192.png',
    order_id: params.orderId,
    prefill: {
      name: params.userName || '',
      email: params.userEmail || '',
      contact: params.userPhone || '',
    },
    theme: {
      color: '#6366F1',
      backdrop_color: '#0B0D17',
    },
    modal: {
      backdropclose: false,
      escape: false,
      animation: true,
    },
  }
}
