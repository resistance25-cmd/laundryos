// src/app/api/riders/create/route.ts
// Admin only — creates auth user + riders table entry
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { CreateRiderRequest } from '@/types'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()

    // Verify admin
    const { data: adminProfile } = await adminClient
      .from('admins')
      .select('id')
      .eq('id', session.user.id)
      .single()
    if (!adminProfile) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json() as CreateRiderRequest
    const { name, phone, email, password, zoneId, vehicleType, vehicleNumber } = body

    if (!name || !phone || !email || !password) {
      return NextResponse.json({ error: 'name, phone, email, password required' }, { status: 400 })
    }

    // Create Supabase auth user with role=rider in metadata
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // no email confirmation needed for admin-created accounts
      user_metadata: {
        name,
        phone: phone.replace(/\D/g, ''),
        role: 'rider',
      },
    })

    if (authError || !authUser.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create auth user' }, { status: 400 })
    }

    // Insert into riders table
    const { data: rider, error: riderError } = await adminClient.from('riders').insert({
      id: authUser.user.id,
      name,
      phone: phone.replace(/\D/g, ''),
      email,
      zone_id: zoneId || null,
      vehicle_type: vehicleType || 'bike',
      vehicle_number: vehicleNumber || null,
      is_active: true,
      is_available: false,
    }).select('id').single()

    if (riderError) {
      // Rollback auth user
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: 'Failed to create rider profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, riderId: rider.id })
  } catch (err: unknown) {
    const error = err as { message?: string }
    console.error('[create-rider]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update rider
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: adminProfile } = await adminClient.from('admins').select('id').eq('id', session.user.id).single()
    if (!adminProfile) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json() as Record<string, unknown>
    const { riderId, ...updates } = body

    if (!riderId) return NextResponse.json({ error: 'riderId required' }, { status: 400 })

    const allowed = ['name', 'phone', 'zoneId', 'vehicleType', 'vehicleNumber', 'isActive']
    const updatePayload: Record<string, unknown> = {}
    if (updates.name) updatePayload.name = updates.name
    if (updates.phone) updatePayload.phone = updates.phone
    if (updates.zoneId !== undefined) updatePayload.zone_id = updates.zoneId || null
    if (updates.vehicleType) updatePayload.vehicle_type = updates.vehicleType
    if (updates.vehicleNumber !== undefined) updatePayload.vehicle_number = updates.vehicleNumber || null
    if (updates.isActive !== undefined) updatePayload.is_active = updates.isActive

    const { error } = await adminClient.from('riders').update(updatePayload).eq('id', riderId as string)
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const error = err as { message?: string }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
