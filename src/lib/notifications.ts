// src/lib/notifications.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { OrderStatus, PushPayload } from '@/types'

// ── Push Notifications ────────────────────────────────────────

/**
 * Send a push notification to a user or rider via web-push.
 * Must be called from a server-side API route only.
 */
export async function sendPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload
): Promise<void> {
  // Dynamically import web-push (server-side only)
  const webpush = await import('web-push')

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error('[push] Missing VAPID environment variables')
    return
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const subscription = {
    endpoint,
    keys: { p256dh, auth },
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string }
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired — caller should clean it up
      throw new Error('SUBSCRIPTION_EXPIRED')
    }
    console.error('[push] Send failed:', error.message)
    throw err
  }
}

/**
 * Send push notifications to all subscriptions for a user
 */
export async function notifyUser(
  userId: string,
  payload: PushPayload,
  supabaseAdmin: SupabaseClient
): Promise<void> {
  const { data: subscriptions, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, id')
    .eq('user_id', userId)

  if (error || !subscriptions || subscriptions.length === 0) return

  const expiredIds: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await sendPushNotification(sub.endpoint, sub.p256dh, sub.auth, payload)
      } catch (err: unknown) {
        const error = err as { message?: string }
        if (error.message === 'SUBSCRIPTION_EXPIRED') {
          expiredIds.push(sub.id)
        }
      }
    })
  )

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds)
  }
}

/**
 * Send push notifications to all subscriptions for a rider
 */
export async function notifyRider(
  riderId: string,
  payload: PushPayload,
  supabaseAdmin: SupabaseClient
): Promise<void> {
  const { data: subscriptions, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, id')
    .eq('rider_id', riderId)

  if (error || !subscriptions || subscriptions.length === 0) return

  const expiredIds: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await sendPushNotification(sub.endpoint, sub.p256dh, sub.auth, payload)
      } catch (err: unknown) {
        const error = err as { message?: string }
        if (error.message === 'SUBSCRIPTION_EXPIRED') {
          expiredIds.push(sub.id)
        }
      }
    })
  )

  if (expiredIds.length > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds)
  }
}

// ── In-App Notifications ──────────────────────────────────────

/**
 * Create an in-app notification record in Supabase
 */
export async function createNotification(
  params: {
    userId?: string
    riderId?: string
    adminId?: string
    title: string
    body: string
    type?: string
    orderId?: string
  },
  supabaseAdmin: SupabaseClient
): Promise<void> {
  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id: params.userId || null,
    rider_id: params.riderId || null,
    admin_id: params.adminId || null,
    title: params.title,
    body: params.body,
    type: params.type || null,
    order_id: params.orderId || null,
    is_read: false,
  })

  if (error) {
    console.error('[notifications] Failed to create notification:', error)
  }
}

// ── Order Status Notifications ────────────────────────────────

/**
 * Get the notification message for each order status change
 */
export function getOrderStatusNotification(
  status: OrderStatus,
  orderNumber: string
): { title: string; body: string } {
  const messages: Record<OrderStatus, { title: string; body: string }> = {
    placed: {
      title: '✅ Order Confirmed',
      body: `Your order ${orderNumber} has been placed successfully.`,
    },
    pickup_scheduled: {
      title: '🗓️ Pickup Scheduled',
      body: `A rider will pick up your clothes for order ${orderNumber}.`,
    },
    picked_up: {
      title: '👕 Clothes Picked Up',
      body: `Your clothes for order ${orderNumber} have been picked up and are on the way to our partner.`,
    },
    processing: {
      title: '🧺 Laundry in Progress',
      body: `Your clothes for order ${orderNumber} are being washed and processed.`,
    },
    ready_for_delivery: {
      title: '📦 Ready for Delivery',
      body: `Your clean clothes are ready! Order ${orderNumber} will be delivered soon.`,
    },
    out_for_delivery: {
      title: '🚴 Out for Delivery',
      body: `Your rider is on the way with order ${orderNumber}. Please be available.`,
    },
    delivered: {
      title: '🎉 Delivered!',
      body: `Order ${orderNumber} has been delivered. Enjoy your fresh laundry!`,
    },
    cancelled: {
      title: '❌ Order Cancelled',
      body: `Order ${orderNumber} has been cancelled. Any charges will be refunded.`,
    },
  }
  return messages[status]
}

// ── SMS Notifications (MSG91) ─────────────────────────────────

/**
 * Send SMS via MSG91. Called from server-side only.
 */
export async function sendSMS(
  phone: string,
  message: string
): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY
  const senderId = process.env.MSG91_SENDER_ID

  if (!authKey || !senderId) {
    console.warn('[sms] MSG91 env vars not set — skipping SMS')
    return
  }

  // Format phone number for India: remove +91 if present, ensure 10 digits
  const formattedPhone = phone.replace(/^\+91/, '').replace(/\D/g, '')
  if (formattedPhone.length !== 10) {
    console.error('[sms] Invalid phone number:', phone)
    return
  }

  try {
    const response = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        sender: senderId,
        short_url: '0',
        mobiles: `91${formattedPhone}`,
        var1: message,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('[sms] MSG91 error:', text)
    }
  } catch (err) {
    console.error('[sms] Failed to send SMS:', err)
  }
}
