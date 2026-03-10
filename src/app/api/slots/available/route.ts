// src/app/api/slots/available/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAvailablePickupSlots, getAvailableDeliverySlots } from '@/lib/slots'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date')
  const zoneId = searchParams.get('zoneId')

  if (!dateStr || !zoneId) {
    return NextResponse.json({ error: 'date and zoneId required' }, { status: 400 })
  }

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const [pickupSlots, deliverySlots] = await Promise.all([
    getAvailablePickupSlots(date, zoneId, adminClient),
    getAvailableDeliverySlots(adminClient),
  ])

  return NextResponse.json({ pickupSlots, deliverySlots })
}
