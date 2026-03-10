// src/app/(customer)/book/page.tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingFlow from './BookingFlow'

export const metadata: Metadata = { title: 'Book a Pickup' }

export default async function BookPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [userRes, addressesRes, slotsRes, subscriptionRes, pricingRes, zonesRes] = await Promise.all([
    supabase.from('users').select('id, name, zone_id').eq('id', session.user.id).single(),
    supabase.from('addresses').select('*').eq('user_id', session.user.id).order('is_default', { ascending: false }),
    supabase.from('pickup_slots').select('*').eq('is_active', true).order('start_time'),
    supabase.from('user_subscriptions').select('*, plan:subscription_plans(*)').eq('user_id', session.user.id).eq('status', 'active').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('pricing').select('*').eq('is_active', true).order('service_type'),
    supabase.from('zones').select('*').eq('is_active', true),
  ])

  if (!userRes.data) redirect('/login?error=unauthorized')

  return (
    <BookingFlow
      user={userRes.data}
      addresses={addressesRes.data || []}
      pickupSlots={slotsRes.data || []}
      subscription={subscriptionRes.data}
      pricing={pricingRes.data || []}
      zones={zonesRes.data || []}
    />
  )
}
