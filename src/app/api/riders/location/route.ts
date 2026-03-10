// src/app/api/riders/location/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { latitude: number; longitude: number; isAvailable?: boolean }
    const { latitude, longitude, isAvailable } = body

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'latitude and longitude required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Verify this session belongs to a rider
    const { data: rider } = await adminClient
      .from('riders')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (!rider) return NextResponse.json({ error: 'Rider not found' }, { status: 404 })

    const updatePayload: Record<string, unknown> = {
      current_latitude: latitude,
      current_longitude: longitude,
    }
    if (isAvailable !== undefined) updatePayload.is_available = isAvailable

    await adminClient.from('riders').update(updatePayload).eq('id', session.user.id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
