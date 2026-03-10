// src/app/api/orders/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notifyUser, getOrderStatusNotification, createNotification } from '@/lib/notifications'
import type { UpdateOrderStatusRequest } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as UpdateOrderStatusRequest
    const { orderId, status, changedBy, changedByRole, notes } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Update order status
    const { data: order, error: updateError } = await adminClient
      .from('orders')
      .update({
        status,
        ...(status === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
        ...(status === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
        ...(status === 'picked_up' ? { pickup_confirmed_at: new Date().toISOString() } : {}),
      })
      .eq('id', orderId)
      .select('id, order_number, user_id, rider_id')
      .single()

    if (updateError || !order) {
      return NextResponse.json({ error: 'Order not found or update failed' }, { status: 404 })
    }

    // Notify user via push + in-app
    const notification = getOrderStatusNotification(status, order.order_number)
    await Promise.all([
      notifyUser(order.user_id, { ...notification, url: `/orders/${orderId}`, orderId }, adminClient),
      createNotification({
        userId: order.user_id,
        title: notification.title,
        body: notification.body,
        type: `status_${status}`,
        orderId,
      }, adminClient),
    ])

    // If delivered, increment rider delivery count
    if (status === 'delivered' && order.rider_id) {
      const { error: riderDeliveryCountError } = await adminClient.rpc('increment_rider_deliveries', {
        rider_id_param: order.rider_id,
      })
      if (riderDeliveryCountError) {
        // RPC may not exist or may fail - ignore for status updates
      }
    }

    return NextResponse.json({ success: true, orderId, status })
  } catch (err: unknown) {
    const error = err as { message?: string }
    console.error('[order-status]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


