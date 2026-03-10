// src/app/api/notifications/send/route.ts
// Admin only
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notifyUser, notifyRider, createNotification } from '@/lib/notifications'
import type { SendNotificationRequest } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: adminProfile } = await adminClient.from('admins').select('id').eq('id', session.user.id).single()
    if (!adminProfile) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json() as SendNotificationRequest
    const { userId, riderId, title, body: msgBody, type, orderId } = body

    if (!title || !msgBody) return NextResponse.json({ error: 'title and body required' }, { status: 400 })

    await Promise.all([
      userId ? notifyUser(userId, { title, body: msgBody, type, orderId }, adminClient) : Promise.resolve(),
      riderId ? notifyRider(riderId, { title, body: msgBody, type, orderId }, adminClient) : Promise.resolve(),
      createNotification({ userId, riderId, title, body: msgBody, type, orderId }, adminClient),
    ])

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
