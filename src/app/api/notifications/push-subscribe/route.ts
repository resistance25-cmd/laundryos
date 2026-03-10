// src/app/api/notifications/push-subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { WebPushSubscription } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as WebPushSubscription & { userType?: 'user' | 'rider' }
    const { endpoint, keys, userType } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const isRider = userType === 'rider'

    // Upsert subscription (by endpoint)
    await adminClient.from('push_subscriptions').upsert({
      user_id: isRider ? null : session.user.id,
      rider_id: isRider ? session.user.id : null,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    }, { onConflict: 'endpoint' })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
