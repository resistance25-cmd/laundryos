// src/app/(customer)/dashboard/page.tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import type { DashboardOrder, UserSubscription } from '@/types'

export const metadata: Metadata = { title: 'Dashboard' }

function first<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: user } = await supabase
    .from('users')
    .select('id, name, wallet_balance, zone_id')
    .eq('id', session.user.id)
    .single()

  if (!user) redirect('/login?error=unauthorized')

  const { data: rawSub } = await supabase
    .from('user_subscriptions')
    .select('*, plan:subscription_plans(*)')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Normalize plan join
  const subscription = rawSub
    ? { ...(rawSub as unknown as UserSubscription), plan: first((rawSub as Record<string, unknown>).plan) }
    : null

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total, pickup_date, created_at, pickup_slot:pickup_slots(label)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Normalize pickup_slot join in each order
  const normalizedOrders: DashboardOrder[] = (orders || []).map((o) => ({
    ...(o as unknown as DashboardOrder),
    pickup_slot: first((o as Record<string, unknown>).pickup_slot as { label: string } | { label: string }[] | null),
  }))

  return (
    <DashboardClient
      user={user}
      subscription={subscription as UserSubscription | null}
      orders={normalizedOrders}
    />
  )
}
