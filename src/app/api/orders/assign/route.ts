// src/app/api/orders/assign/route.ts
// Admin only — service_role bypasses RLS
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { AssignOrderRequest } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify admin
    const adminClient = createAdminClient()
    const { data: adminProfile } = await adminClient
      .from('admins')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (!adminProfile) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json() as AssignOrderRequest
    const { orderId, riderId, deliveryRiderId, laundryPartnerId } = body

    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

    const updatePayload: Record<string, string | null> = {}
    if (riderId !== undefined) updatePayload.rider_id = riderId || null
    if (deliveryRiderId !== undefined) updatePayload.delivery_rider_id = deliveryRiderId || null
    if (laundryPartnerId !== undefined) updatePayload.laundry_partner_id = laundryPartnerId || null

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    // Auto-advance status to pickup_scheduled if rider assigned and status is placed
    const { data: order } = await adminClient
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (order?.status === 'placed' && riderId) {
      updatePayload.status = 'pickup_scheduled'
    }

    const { error } = await adminClient
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)

    if (error) return NextResponse.json({ error: 'Assignment failed' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const error = err as { message?: string }
    console.error('[assign-order]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
