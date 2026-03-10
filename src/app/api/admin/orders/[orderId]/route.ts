import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('admins')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const [orderRes, ridersRes, partnersRes, historyRes] = await Promise.all([
      adminClient
        .from('orders')
        .select(`*, user:users(name, phone, email), address:addresses(line1, line2, landmark), pickup_slot:pickup_slots(label), items:order_items(*)`)
        .eq('id', params.orderId)
        .single(),
      adminClient.from('riders').select('id, name').eq('is_active', true),
      adminClient.from('laundry_partners').select('id, name').eq('is_active', true),
      adminClient
        .from('order_status_history')
        .select('status, created_at, changed_by_role')
        .eq('order_id', params.orderId)
        .order('created_at', { ascending: false }),
    ])

    if (orderRes.error || !orderRes.data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      order: orderRes.data,
      riders: ridersRes.data || [],
      partners: partnersRes.data || [],
      statusHistory: historyRes.data || [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
