// src/app/admin/partners/page.tsx
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { first } from '@/lib/supabase/helpers'

export const metadata: Metadata = { title: 'Partners' }

export default async function AdminPartnersPage() {
  const adminClient = createAdminClient()
  const { data: partners } = await adminClient
    .from('laundry_partners')
    .select('*, zone:zones(name)')
    .order('created_at', { ascending: false })

  type PartnerRow = { id: string; name: string; phone: string; is_active: boolean; zone: { name: string } | { name: string }[] | null }
  const rows = (partners || []) as unknown as PartnerRow[]

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>Laundry Partners</h1>
        <Link href="/admin/partners/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
          <Plus className="w-4 h-4" /> Add Partner
        </Link>
      </div>
      <div className="admin-card rounded-xl overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center"><p style={{ color: '#64748B' }}>No partners yet</p></div>
        ) : (
          rows.map((p) => {
            const zone = first(p.zone)
            return (
              <div key={p.id} className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid #1E2130' }}>
                <div>
                  <p className="font-medium" style={{ color: '#F1F5F9' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: '#64748B' }}>{zone?.name || 'No zone'} · {p.phone}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: p.is_active ? 'rgba(5,150,105,0.2)' : 'rgba(100,116,139,0.2)',
                    color: p.is_active ? '#059669' : '#94A3B8',
                  }}>
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
