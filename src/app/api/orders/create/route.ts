// src/app/api/orders/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { consumeCredit } from '@/lib/credits'
import { isSlotAvailable } from '@/lib/slots'
import { createRazorpayOrder } from '@/lib/razorpay'
import { createNotification } from '@/lib/notifications'
import type { CreateOrderRequest, ServiceType, CreditType } from '@/types'

function serviceTypeToCreditType(serviceType: ServiceType): CreditType {
  const map: Record<ServiceType, CreditType> = {
    wash_fold: 'wash',
    steam_press: 'press',
    dry_clean: 'dry_clean',
  }
  return map[serviceType]
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as CreateOrderRequest
    const {
      userId, addressId, zoneId, pickupDate, pickupSlotId,
      items, orderType, subscriptionId, specialInstructions,
    } = body

    if (!userId || !pickupDate || !pickupSlotId || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify requesting user matches session
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Check slot availability (race-condition guard)
    const slotOk = await isSlotAvailable(pickupSlotId, pickupDate, zoneId, adminClient)
    if (!slotOk) {
      return NextResponse.json({ error: 'This pickup slot is full. Please choose another.' }, { status: 409 })
    }

    // Calculate totals
    const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)

    // For subscription orders, consume credits atomically
    if (orderType === 'subscription' && subscriptionId) {
      for (const item of items) {
        const creditType = serviceTypeToCreditType(item.serviceType as ServiceType)
        // We'll consume after order creation, pass a placeholder orderId
        // We create order first then consume — if credit fails, we rollback (best-effort)
      }
    }

    // Generate order number
    const orderNum = `LOS${Date.now().toString().slice(-8)}`

    // Create order
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        order_number: orderNum,
        user_id: userId,
        address_id: addressId || null,
        zone_id: zoneId,
        pickup_date: pickupDate,
        pickup_slot_id: pickupSlotId,
        order_type: orderType,
        subscription_id: subscriptionId || null,
        status: 'placed',
        subtotal,
        discount: 0,
        delivery_charge: 0,
        total: orderType === 'subscription' ? 0 : subtotal,
        payment_status: orderType === 'subscription' ? 'paid' : 'pending',
        special_instructions: specialInstructions || null,
        city: 'Indore',
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Insert order items
    const { error: itemsError } = await adminClient.from('order_items').insert(
      items.map((item) => ({
        order_id: order.id,
        service_type: item.serviceType,
        item_name: item.itemName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice,
      }))
    )

    if (itemsError) {
      // Rollback order
      await adminClient.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Failed to save order items' }, { status: 500 })
    }

    // Consume credits for subscription orders
    if (orderType === 'subscription' && subscriptionId) {
      for (const item of items) {
        const creditType = serviceTypeToCreditType(item.serviceType as ServiceType)
        for (let i = 0; i < item.quantity; i++) {
          try {
            await consumeCredit(userId, creditType, order.id, adminClient)
          } catch (err: unknown) {
            const error = err as { message?: string }
            // Rollback order if credits fail
            await adminClient.from('orders').delete().eq('id', order.id)
            return NextResponse.json(
              { error: error.message || 'Insufficient credits' },
              { status: 422 }
            )
          }
        }
      }
    }

    // Create in-app notification
    await createNotification({
      userId,
      title: '✅ Order Confirmed',
      body: `Your order ${order.order_number} has been placed.`,
      type: 'order_placed',
      orderId: order.id,
    }, adminClient)

    // For pay-per-item orders, create Razorpay order
    if (orderType === 'single' && subtotal > 0) {
      try {
        const rzpOrder = await createRazorpayOrder(
          subtotal,
          'INR',
          order.id,
          { orderNumber: order.order_number, userId }
        )

        // Store pending payment
        await adminClient.from('payments').insert({
          user_id: userId,
          order_id: order.id,
          razorpay_order_id: rzpOrder.id,
          amount: subtotal,
          currency: 'INR',
          status: 'pending',
        })

        return NextResponse.json({
          orderId: order.id,
          orderNumber: order.order_number,
          razorpayOrder: rzpOrder,
        })
      } catch (err: unknown) {
        const error = err as { message?: string }
        // Order created but payment initiation failed — still return order
        console.error('[create-order] Razorpay error:', error.message)
        return NextResponse.json({
          orderId: order.id,
          orderNumber: order.order_number,
          razorpayError: 'Payment initiation failed. Please try again.',
        })
      }
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
    })
  } catch (err: unknown) {
    const error = err as { message?: string }
    console.error('[create-order]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
