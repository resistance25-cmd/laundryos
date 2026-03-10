// src/app/admin/zones/page.tsx
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Zones' }

export default async function AdminZonesPage() {
  const adminClient = createAdminClient()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5" style={{ color: '#F1F5F9' }}>Zones</h1>
      <div className="admin-card rounded-xl p-8 text-center">
        <p style={{ color: '#64748B' }}>Coming soon — Zones management</p>
      </div>
    </div>
  )
}
