// src/app/admin/subscriptions/page.tsx
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Subscriptions' }

export default async function AdminSubscriptionsPage() {
  const adminClient = createAdminClient()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5" style={{ color: '#F1F5F9' }}>Subscriptions</h1>
      <div className="admin-card rounded-xl p-8 text-center">
        <p style={{ color: '#64748B' }}>Coming soon — Subscriptions management</p>
      </div>
    </div>
  )
}
